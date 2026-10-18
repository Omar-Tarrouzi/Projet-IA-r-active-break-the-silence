const test=require('node:test');
const assert=require('node:assert/strict');
const {TransformationScene,transformationShot,TRANSFORMATION_DURATION}=require('../systems/TransformationScene.js');
test('transformation storyboard has close shots and a wide final reveal',()=>{
  assert.equal(transformationShot(.5).name,'last-chord');
  assert.equal(transformationShot(1.8).name,'guitar-awakens');
  assert.equal(transformationShot(3).name,'eyes-and-crown');
  assert.equal(transformationShot(6).name,'hero-reveal');
  assert.ok(transformationShot(3).scale>transformationShot(6).scale);
  assert.equal(transformationShot(3,true).scale,1);
});
test('hero title arrives after the camera pulls back and exits before the scene ends',()=>{
  const scene=Object.create(TransformationScene.prototype);
  scene.time=4.8;assert.equal(scene.titleVisible,false);
  scene.time=5.5;assert.equal(scene.titleVisible,true);assert.ok(scene.titleProgress>0);
  scene.time=TRANSFORMATION_DURATION;assert.equal(scene.titleVisible,false);
});

