export function JSONSafeParse(data: any) {
  try {
    return JSON.parse(JSON.parse(data));
  } catch (error) {
    return {};
  }
}
