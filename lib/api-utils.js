// lib/api-utils.js
export async function handleApiResponse(response) {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response received:', text.substring(0, 200));
    throw new Error('Server returned non-JSON response');
  }
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || `HTTP error! status: ${response.status}`);
  }
  
  return result;
}
