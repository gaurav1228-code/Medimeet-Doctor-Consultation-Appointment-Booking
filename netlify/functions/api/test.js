exports.handler = async (event, context) => {
  console.log('🔍 Test API function called');
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({ 
      success: true,
      message: 'API test function is working!',
      function: 'api/test',
      timestamp: new Date().toISOString(),
      path: event.path
    }),
  };
};