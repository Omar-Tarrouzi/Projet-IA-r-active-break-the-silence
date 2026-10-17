// Six original four-bar motifs. MIDI pitches are score data, never Vehicle positions.
const MUSIC_THEMES=Object.freeze({
 ASCENT:{bpm:128,root:50,mode:[0,2,3,5,7,9,10],chords:[0,5,3,7],bass:[0,0,7,0,0,7,5,7],lead:[12,-1,15,-1,17,15,12,-1,10,-1,12,15,17,-1,15,-1],arp:[0,7,12,7,3,7,12,7],drums:'K--hS-h-K-h-S-h-',feel:'drive'},
 HUSH:{bpm:96,root:47,mode:[0,1,3,5,7,8,10],chords:[0,1,5,0],bass:[0,-1,0,7,0,-1,1,7],lead:[19,-1,-1,18,15,-1,13,-1,12,-1,13,-1,8,-1,-1,-1],arp:[0,-1,7,-1,12,-1,7,-1],drums:'K---S---K-h-S---',feel:'silence'},
 MUTE:{bpm:146,root:50,mode:[0,1,3,5,7,8,10],chords:[0,1,3,1],bass:[0,0,1,0,7,1,0,10],lead:[12,-1,13,15,-1,13,12,-1,10,12,-1,8,7,-1,8,-1],arp:[0,7,13,7,1,8,13,8],drums:'K-h-S-h-KK--S-h-',feel:'discord'},
 ECHO:{bpm:112,root:52,mode:[0,2,3,5,7,9,10],chords:[0,3,7,5],bass:[0,-1,7,0,3,-1,7,5],lead:[12,-1,15,-1,-1,17,-1,15,12,-1,-1,10,-1,12,-1,-1],arp:[0,7,12,15,12,7,3,7],drums:'K---S-h-K---S-h-',feel:'echo'},
 MEASURE:{bpm:150,root:48,mode:[0,2,4,6,7,9,11],chords:[0,6,4,7],bass:[0,7,0,6,0,7,4,6],lead:[12,-1,16,19,-1,18,16,-1,12,14,-1,16,19,-1,18,16],arp:[0,7,12,16,7,12,16,19],drums:'K-h-S-h-K-h-S-h-',feel:'clock'},
 TRIUMPH:{bpm:156,root:50,mode:[0,2,4,5,7,9,11],chords:[0,5,7,0],bass:[0,0,7,0,5,5,7,0],lead:[12,14,16,-1,19,16,14,12,17,19,21,-1,19,16,14,12],arp:[0,7,12,16,5,9,12,16],drums:'K-h-S-h-KK-hS-h-',feel:'victory'}
});
if(typeof module!=='undefined')module.exports={MUSIC_THEMES};
