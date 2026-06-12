export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data:text/csv;base64, prefix
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
