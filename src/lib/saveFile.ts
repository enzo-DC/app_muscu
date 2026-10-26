/**
 * Donne un fichier à l'utilisateur : menu de partage du téléphone quand il existe
 * (sur iPhone : Fichiers, AirDrop, mail…), sinon téléchargement classique.
 */
export async function saveFile(content: string, fileName: string, type = 'application/json'): Promise<void> {
  const file = new File([content], fileName, { type });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return;
    } catch (error) {
      // Partage annulé par l'utilisateur : rien d'autre à faire
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
