// /netlify/functions/api/admin.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { type } = event.queryStringParameters || {};
    const { userId } = context.clientContext?.user || {};

    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    let data, error;

    switch (type) {
      case 'pending-doctors':
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'DOCTOR')
          .eq('verification_status', 'PENDING')
          .order('created_at', { ascending: true }));
        break;

      case 'verified-doctors':
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'DOCTOR')
          .in('verification_status', ['VERIFIED', 'REJECTED'])
          .order('created_at', { ascending: false }));
        break;

      case 'patients':
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'PATIENT')
          .order('created_at', { ascending: false }));
        break;

      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Invalid type parameter' })
        };
    }

    if (error) {
      console.error(`Error fetching ${type}:`, error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Database error' })
      };
    }

    const responseKey = type === 'patients' ? 'patients' : 'doctors';
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        [responseKey]: data || [],
        success: true 
      })
    };
    
  } catch (error) {
    console.error('Error in admin API:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
