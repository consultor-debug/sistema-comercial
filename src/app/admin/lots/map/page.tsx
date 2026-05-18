import { redirect } from 'next/navigation'

// La subida del plano se hace desde el detalle de cada proyecto
// /admin/projects → selecciona un proyecto → sección "Plano del proyecto"
export default function MapUploadRedirect() {
    redirect('/admin/projects')
}
