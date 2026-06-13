export function getErrorMessage(error, fallback = 'No se pudo completar la operación.') {
  if (error?.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el backend. Verifica que siga ejecutándose en el puerto 4000.';
  }
  return error?.response?.data?.message || fallback;
}
