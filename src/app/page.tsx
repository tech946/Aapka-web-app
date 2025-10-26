import Link from 'next/link';

export default function App() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen gap-4'>
      <h1 className='text-3xl font-bold'>Welcome to Proptz</h1>
      <Link href='/Home' className='text-blue-600 hover:underline'>
        Go to Marketing Home
      </Link>
    </div>
  );
}
