/* globals define*/
define(function(require, exports){
  'use strict';
  
  var ToDo = function (title, category) {
  this.title = title;
  this.category = category;
  this.status = 'Pending';
  this.creationTime = new Date().toLocaleTimeString();
  this.completionTime = '';
};

exports.updateToDo = function(srcObj,updateObj){
  if(!srcObj || !updateObj)
    return;
  
  if(updateObj.title)
    srcObj.title = updateObj.title;
  
  if(updateObj.category)
    srcObj.category = updateObj.category;
  
  if(updateObj.status)
    srcObj.status = updateObj.status;
  
  if(updateObj.completionTime)
    srcObj.completionTime = updateObj.completionTime;
  
  return srcObj;
};
  
  exports.createNewToDo = function(title,category){
    return new ToDo(title,category);
  };
});