import { base_path as BASE_PATH, image_path as IMAGE_PATH } from '../../environment'

export const APP_NAME = (import.meta as any).env?.VITE_APP_NAME || 'template'
export const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION || '0.0.0'
export { BASE_PATH, IMAGE_PATH }
