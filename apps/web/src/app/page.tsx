export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center p-24'>
      <div className='z-10 max-w-5xl w-full items-center justify-between font-mono text-sm'>
        <h1 className='text-4xl font-bold mb-8'>Welcome to Appraisal App</h1>
        <p className='text-lg mb-4'>
          Professional appraisal management software for modern teams.
        </p>
        <div className='mt-8'>
          <a
            href='https://app.localhost:3001'
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
          >
            Go to App
          </a>
        </div>
      </div>
    </main>
  )
}
