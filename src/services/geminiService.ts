export const generateDescription = async (imageFile: File, userText: string): Promise<string> => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (!backendUrl) {
    // This provides a helpful error during development if the .env file is missing.
    if (import.meta.env.DEV) {
       throw new Error("VITE_BACKEND_URL environment variable is not set. Please create a .env.local file and add VITE_BACKEND_URL=http://localhost:3001");
    }
    throw new Error("VITE_BACKEND_URL environment variable is not set.");
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('userText', userText);

  try {
    const response = await fetch(`${backendUrl}/generate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.description;
  } catch (error) {
    console.error("Error communicating with the backend:", error);
    if (error instanceof Error) {
        // Re-throw the specific error message from the backend if available
        throw new Error(error.message || "Не удалось связаться с сервером. Пожалуйста, попробуйте еще раз.");
    }
    throw new Error("Не удалось связаться с сервером. Пожалуйста, попробуйте еще раз.");
  }
};
