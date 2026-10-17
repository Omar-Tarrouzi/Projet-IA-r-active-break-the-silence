// French captions explain only mechanics that actually run in this project.
function demoCommentary({opening=false,boss=null,regular=null,action='SEEK',time=0,shots=0}){
 if(opening)return {id:'ORIGIN',tag:'ARCHIVE // ORIGINE',title:'UNE CHANSON INTERDITE',body:'Le guitariste joue. Quatre puissances l’emportent. Sa guitare prend vie et monte à sa poursuite.',formula:'SÉQUENCE CINÉMATIQUE · ACTEURS PILOTÉS PAR STEERING'};
 if(boss){
  const name=boss.profile?.name||'VESPER';
  if(boss.phase==='ENTRANCE')return {id:'INTRO'+name,tag:'SIGNAL // SOUVERAIN',title:name+' DÉTECTÉ',body:'Ses particules forment une réserve finie : chaque point détruit manque aux constructions suivantes.',formula:'FORMATION → ARRIVE → APPLY FORCE'};
  if(boss.phase==='EXPOSED')return {id:'CORE'+name,tag:'ANALYSE // FINALE',title:'NOYAU EXPOSÉ',body:'La guitare doit viser le corps avec la bonne fréquence. Chaque onde ne compte qu’une fois.',formula:'VISÉE · CÔNE · RÉSONANCE'};
  if(boss.profile?.key==='ONYX')return {id:'ONYX'+(action==='TUG'?'TUG':'CHAIN'),tag:'CONTRE-MESURE // DISCORDE',title:action==='TUG'?'TIRER, PUIS RELÂCHER':'CHAÎNE VIVANTE',body:'La pointe entraîne une chaîne de particules. Charger près d’elle, puis relâcher, la renvoie vers Onyx.',formula:'SEEK + COHÉSION → RETOUR STEERÉ'};
  if(boss.profile?.key==='NOVA')return {id:'NOVA'+(action==='PARRY'?'PARRY':'ECHO'),tag:'CONTRE-MESURE // ÉCHO',title:'LA FRÉQUENCE REVIENT',body:'Nova répète la dernière fréquence jouée. Une onde de la même couleur retourne son projectile.',formula:'ARRIVE → SEEK · RÉSONANCE'};
  if(boss.profile?.key==='CADENCE')return {id:'CADENCE',tag:'CONTRE-MESURE // MESURE',title:'LA FENÊTRE DU TEMPO',body:'Cadence ouvre une courte fenêtre à chaque battement. Choisir LOW ou HIGH puis relâcher sur le flash.',formula:'TIMING RÉACTIF · POINTS EN FORMATION'};
  return {id:'VESPER'+boss.phase,tag:'ANALYSE // SILENCE',title:boss.phase.includes('MISSILE')?'RENVOYER LE SIGNAL':boss.phase.includes('ORBIT')?'UN INTERSTICE TOURNE':'LE TRÔNE OBÉIT',body:boss.phase.includes('MISSILE')?'Accorder la guitare à la couleur du missile pour le renvoyer.':boss.phase.includes('ORBIT')?'Les anneaux laissent une ouverture mobile. La guitare suit cet espace libre.':'Les particules utilisent ARRIVE pour construire, puis FLEE pour se disperser sous l’onde.',formula:'SEEK · ARRIVE · FLEE · RÉSONANCE'};
 }
 if(time<5)return {id:'CONTROLS',tag:'ENTRÉE // LE SON EST UNE COMMANDE',title:'CLAQUEZ · CHANTEZ · JOUEZ',body:'Un claquement bref déclenche MID. Un son tenu charge HIGH. Souris ou toucher restent disponibles sans micro.',formula:'MICRO → DÉTECTION → ONDE SONORE'};
 if(action==='EVADE')return {id:'EVADE',tag:'ANALYSE // DANGER',title:'ÉVITER LA TRAJECTOIRE',body:'La guitare choisit une zone libre puis applique une force de direction. Sa position n’est jamais téléportée.',formula:'VITESSE DÉSIRÉE − VITESSE ACTUELLE'};
 if(regular)return {id:'SHAPE'+regular.shapeKey,tag:'ANALYSE // FORMATION',title:regular.shapeKey+' EN MOUVEMENT',body:'Chaque point cherche sa place dans la figure. Le groupe combine séparation, alignement et cohésion ; l’onde le disperse.',formula:'SEEK + ARRIVE + FLOCKING + FLEE'};
 return {id:'ASCENT'+Math.floor(time/12)%2,tag:'ASCENSION // PILOTAGE AUTONOME',title:shots?'LE SIGNAL A RÉPONDU':'LA GUITARE S’ÉVEILLE',body:'La guitare suit une cible avec ARRIVE. Les ennemis prennent forme par steering et réagissent localement aux ondes.',formula:'STEERING = VITESSE DÉSIRÉE − VITESSE ACTUELLE'};
}
if(typeof module!=='undefined')module.exports={demoCommentary};
