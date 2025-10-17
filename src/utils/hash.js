export async function sha256(message){
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest){
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  }
  // fallback naive hash
  let h = 0; for (let i=0;i<message.length;i++){ h = ((h<<5)-h)+message.charCodeAt(i); h |= 0; }
  return 'fallback-'+Math.abs(h).toString(16);
}

export default { sha256 };
