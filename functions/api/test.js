exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      success: true,
      message: 'API test function is working!',
      path: event.path,
      timestamp: new Date().toISOString()
    }),
  };
};