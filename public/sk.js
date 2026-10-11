/* eslint-disable no-undef */
/**
 * LEGADO: versões antigas do app registravam "/sk.js" como service worker.
 * Pra quem ainda tiver esse registro, ele passa a se comportar igual ao
 * "/sw.js" (o app atual registra só o /sw.js e substitui este).
 */
importScripts("/sw.js");
