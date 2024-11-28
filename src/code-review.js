async function postApiCall(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  
    if (!response.ok) {
      throw new Error(`Failed to post data: ${response.statusText}`);
    }
  
    return response.json();
}


async function doReview(apiEndpoint, apiKey, model, userPrompt) {
    const postData = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant."
            },
            {
                "role": "user",
                "content": userPrompt
            }
        ]
      }

      const response = await postApiCall(apiEndpoint, postData);
      console.log(`Response: ${JSON.stringify(response)}`);
      return response.choices[0].message.content;
}