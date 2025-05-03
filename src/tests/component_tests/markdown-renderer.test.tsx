/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import MarkdownRenderer from '@/components/custom/markdown-renderer';
import ReactMarkdown from 'react-markdown';

jest.mock('react-markdown', () => jest.fn((props: any) => <div data-testid="markdown">{props.children}</div>));
jest.mock('remark-gfm', () => () => {});
jest.mock('rehype-highlight', () => () => {});
jest.mock('highlight.js/styles/atom-one-dark.css', () => {});

describe('MarkdownRenderer Component', () => {
  beforeEach(() => {
    (ReactMarkdown as jest.Mock).mockClear();
  });

  it('renders content as children to ReactMarkdown', () => {
    render(<MarkdownRenderer content="Hello **world**" />);
    const props = (ReactMarkdown as jest.Mock).mock.calls[0][0];
    expect(props.children).toBe('Hello **world**');
  });

  it('processes frontmatter correctly', () => {
    const front = '---\ntitle: Test Title\n---';
    render(<MarkdownRenderer content={front} />);
    const expected = '---\n\ntitle: Test Title\n\n---';
    const props = (ReactMarkdown as jest.Mock).mock.calls[0][0];
    expect(props.children).toBe(expected);
  });

  it('passes remarkGfm and rehypeHighlight plugins', () => {
    render(<MarkdownRenderer content="Simple text" />);
    const props = (ReactMarkdown as jest.Mock).mock.calls[0][0];
    expect(props.remarkPlugins).toBeInstanceOf(Array);
    expect(props.rehypePlugins).toBeInstanceOf(Array);
  });

  it('includes custom components mapping for headings and links', () => {
    render(<MarkdownRenderer content="# Heading" />);
    const props = (ReactMarkdown as jest.Mock).mock.calls[0][0];
    expect(typeof props.components.h1).toBe('function');
    expect(typeof props.components.a).toBe('function');
  });

  it('renders the processed markdown inside the container', () => {
    render(<MarkdownRenderer content="Test content" />);
    expect(screen.getByTestId('markdown')).toHaveTextContent('Test content');
  });
});