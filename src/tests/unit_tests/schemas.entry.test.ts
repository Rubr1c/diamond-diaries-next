/* eslint-disable @typescript-eslint/no-explicit-any */
import { entrySchema } from '@/schemas/entry-schemas';
import { z, ZodError } from 'zod';

describe('Entry Schemas', () => {
  describe('entrySchema', () => {
    type EntryInput = z.input<typeof entrySchema>;

    const validData: EntryInput = {
      title: 'My First Entry',
      content: 'This is the content of the entry.',
      folderId: '12345',
      tagNames: ['journal', 'thoughts'],
    };

    const minimalValidData: EntryInput = {
      title: 'Minimal Entry',
      content: 'Just the basics.',
    };

    it('should validate correct entry data successfully', () => {
      expect(() => entrySchema.parse(validData)).not.toThrow();
      expect(entrySchema.parse(validData)).toEqual(validData);
    });

    it('should validate minimal correct entry data successfully (optional fields omitted)', () => {
      expect(() => entrySchema.parse(minimalValidData)).not.toThrow();
      expect(entrySchema.parse(minimalValidData)).toEqual(minimalValidData);
    });

    it('should fail validation if title is empty', () => {
      const invalidData = { ...validData, title: '' };
      expect(() => entrySchema.parse(invalidData)).toThrow(ZodError);
      try {
        entrySchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const titleError = error.errors.find((e) => e.path[0] === 'title');
          expect(titleError).toBeDefined();
          expect(titleError?.message).toBe('Title is required');
        } else {
          throw error;
        }
      }
    });

    it('should fail validation if title is missing', () => {
      const invalidData = {
          content: validData.content,
          folderId: validData.folderId,
          tagNames: validData.tagNames
      };
      expect(() => entrySchema.parse(invalidData)).toThrow(ZodError);
      try {
        entrySchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const titleError = error.errors.find((e) => e.path[0] === 'title');
          expect(titleError).toBeDefined();
          expect(titleError?.code).toBe('invalid_type');
        } else {
          throw error;
        }
      }
    });

    it('should fail validation if content is empty', () => {
      const invalidData = { ...validData, content: '' };
      expect(() => entrySchema.parse(invalidData)).toThrow(ZodError);
      try {
        entrySchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const contentError = error.errors.find((e) => e.path[0] === 'content');
          expect(contentError).toBeDefined();
          expect(contentError?.message).toBe('Content is required');
        } else {
          throw error;
        }
      }
    });

    it('should fail validation if content is missing', () => {
       const invalidData = {
          title: validData.title,
          folderId: validData.folderId,
          tagNames: validData.tagNames
       };
       expect(() => entrySchema.parse(invalidData)).toThrow(ZodError);
       try {
         entrySchema.parse(invalidData);
       } catch (error) {
         if (error instanceof ZodError) {
           const contentError = error.errors.find((e) => e.path[0] === 'content');
           expect(contentError).toBeDefined();
           expect(contentError?.code).toBe('invalid_type');
         } else {
           throw error;
         }
       }
    });

    it('should pass validation if folderId is omitted', () => {
        expect(() => entrySchema.parse(minimalValidData)).not.toThrow();
    });

    it('should pass validation if folderId is an empty string', () => {
      const dataWithEmptyFolderId: EntryInput = { ...validData, folderId: '' };
      expect(() => entrySchema.parse(dataWithEmptyFolderId)).not.toThrow();
      expect(entrySchema.parse(dataWithEmptyFolderId)).toEqual(dataWithEmptyFolderId);
    });

    it('should pass validation if tagNames is omitted', () => {
        expect(() => entrySchema.parse(minimalValidData)).not.toThrow();
    });

    it('should pass validation if tagNames is an empty array', () => {
      const dataWithEmptyTags: EntryInput = { ...validData, tagNames: [] };
      expect(() => entrySchema.parse(dataWithEmptyTags)).not.toThrow();
      expect(entrySchema.parse(dataWithEmptyTags)).toEqual(dataWithEmptyTags);
    });

    it('should fail validation if tagNames is not an array of strings', () => {
      const invalidData = { ...validData, tagNames: ['tag1', 123] as any };
      expect(() => entrySchema.parse(invalidData)).toThrow(ZodError);
      try {
        entrySchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          const tagError = error.errors.find((e) => e.path.length === 2 && e.path[0] === 'tagNames' && e.path[1] === 1);
          expect(tagError).toBeDefined();
          expect(tagError?.code).toBe('invalid_type');
          expect(tagError?.message).toContain('Expected string, received number');
        } else {
          throw error;
        }
      }
    });

    it('should ignore extra fields', () => {
      const dataWithExtra = {
        ...validData,
        extraField: 'should be ignored',
        anotherExtra: 123,
      };
      expect(() => entrySchema.parse(dataWithExtra)).not.toThrow();
      expect(entrySchema.parse(dataWithExtra)).toEqual(validData);
    });
  });
});