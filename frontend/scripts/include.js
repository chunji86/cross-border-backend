export async function loadPartials() {
  try {
    const header = await fetch('/partials/header.html');
    const footer = await fetch('/partials/footer.html');

    if (!header.ok || !footer.ok) {
      throw new Error('Header or footer fetch failed');
    }

    const headerHtml = await header.text();
    const footerHtml = await footer.text();

    const headerElement = document.getElementById('header');
    const footerElement = document.getElementById('footer');

    if (headerElement) headerElement.innerHTML = headerHtml;
    if (footerElement) footerElement.innerHTML = footerHtml;
  } catch (error) {
    console.error('Error loading partials:', error);
  }
}
