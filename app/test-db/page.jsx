// app/test-db/page.jsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function TestDB() {
  try {
    // Test the availability table
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .limit(5);

    if (error) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-red-500">Database Error</h1>
          <pre className="bg-red-900/20 p-4 rounded">{error.message}</pre>
        </div>
      );
    }

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-green-500">Database Connected Successfully!</h1>
        <p>Found {data.length} availability slots</p>
        <pre className="bg-green-900/20 p-4 rounded mt-4">{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <pre className="bg-red-900/20 p-4 rounded">{error.message}</pre>
      </div>
    );
  }
}

export default TestDB;