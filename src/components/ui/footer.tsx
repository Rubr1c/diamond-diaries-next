import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#003243] text-white px-4 py-2 flex items-center justify-between text-sm fixed bottom-0 left-0 z-10">
      <div className="flex items-center space-x-4">
        <Link href="/help" className="hover:underline">
          Help
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
      </div>
      <div>© {new Date().getFullYear()} Diamond Diaries</div>
    </footer>
  );
}
