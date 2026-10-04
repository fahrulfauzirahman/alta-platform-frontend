import App from './App.svelte';
import '@alta/tokens/src/index.css';

const el = document.getElementById('app');
if (el) new App({ target: el });
