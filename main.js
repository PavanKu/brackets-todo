/* globals require, exports, module, window, define, brackets, $, alert, document */
define(function (require, exports, module) {
  'use strict';

  var CommandManager = brackets.getModule('command/CommandManager'),
    Menus = brackets.getModule('command/Menus'),
    PanelManager = brackets.getModule('view/PanelManager'),
    AppInit = brackets.getModule('utils/AppInit'),
    FileSystem = brackets.getModule('filesystem/FileSystem'),
    FileUtils = brackets.getModule('file/FileUtils'),
    ExtensionUtils = brackets.getModule('utils/ExtensionUtils');

  // First, register a command - a UI-less object associating an id to a handler
  var TODO_PANEL_DISPLAY_COMMAND_ID = 'todo.panel.display', // package-style naming to avoid collisions
    panel,
    panelHtml = require('text!htmlContent/panel.html'),
    dataFile = FileSystem.getFileForPath(ExtensionUtils.getModulePath(module) + 'data.json'),
    dataJSON = {},
    todo = require('./todo');
  //    todoList = [],

  // Function to run when the menu item is clicked
  function displayToDoPanel() {
    if (panel.isVisible()) {
      hidePanel(panel);
    } else {
      showPanel(panel);
    }
  }

  function showPanel(panel) {
    //Read JSON file and populate the view
    var promise = FileUtils.readAsText(dataFile);
    promise.done(function (text) {
      if (text.length === 0)
        return;

      var currentDate = new Date().toDateString();
      dataJSON = JSON.parse(text);
      populateView(dataJSON[currentDate]);
    })
      .fail(function (errorCode) {
        alert(errorCode);
      });

    panel.show();
    CommandManager.get(TODO_PANEL_DISPLAY_COMMAND_ID).setChecked(true);

  }

  function hidePanel(panel) {
    panel.hide();
    CommandManager.get(TODO_PANEL_DISPLAY_COMMAND_ID).setChecked(false);
  }

  function populateView(toDoList) {
    if (!toDoList || toDoList.length === 0)
      return;

    $('#todoView > tbody').html('');
    var todoHTML = [];
    for (var i = toDoList.length - 1; i >= 0; i -= 1) {
      var todo = toDoList[i];
      var htmlString = '<tr><td><label class="checkbox" style="font-size:13px;"><input class="todoCheckbox" type="checkbox" style="top:1px;" ' + (todo.status === 'Completed' ? 'checked' : '') + '> ' + todo.title + ' </label></td><td class="span3 hide"><button type="button" class="btn btn-mini editToDo" style="margin:0 5px;">Edit</button><button type="button" class="removeToDo btn btn-mini" style="margin:0 5px;">Remove</button></td></tr>';
      todoHTML.push(htmlString);
    }

    $('#todoView > tbody').html(todoHTML.join(''));
  }

  AppInit.appReady(function () {
    CommandManager.register('To Do', TODO_PANEL_DISPLAY_COMMAND_ID, displayToDoPanel);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.FILE_MENU);
    menu.addMenuItem(TODO_PANEL_DISPLAY_COMMAND_ID, 'Ctrl-Alt-Z');

    // We could also add a key binding at the same time:
    //menu.addMenuItem(MY_COMMAND_ID, 'Ctrl-Alt-H');
    // (Note: 'Ctrl' is automatically mapped to 'Cmd' on Mac)
    panel = PanelManager.createBottomPanel(TODO_PANEL_DISPLAY_COMMAND_ID, $(panelHtml));

    //Create data file if it doesn't exist in extension folder
    dataFile.exists(function (err, exists) {
      if (err || exists) {
        return;
      } else {
        dataFile.write("", function (err) {
          if (err) {
            alert('Write failed');
          }
        });
      }

    });

    /*=============DOM Manipulation========*/
    $(document)
      .on('click', '#todo_panel a.close', function (e) {
        hidePanel(panel);
      })
      .on('keypress', '#todo_panel #inputNewToDo', function (e) {
        if (e.keyCode === 13) {
          //Enter presssed
          addNewToDo();
        }
      })
      .on('click', '#todo_panel #addToDo', function (e) {
        addNewToDo();
      })
      .on('click', '#todoView button.removeToDo', function (e) {
        var selectedRow = $(this).parent().parent();
        var todoIndex = $('#todoView tr').index(selectedRow);
        removeTodo(todoIndex);
        $(selectedRow).remove();
      })
      .on('mouseenter', '#todoView tr', function (e) {
        $(this).children()[1].className = 'span3';
      })
      .on('mouseleave', '#todoView tr', function (e) {
        $(this).children()[1].className = 'span3 hide ';
      })
      .on('change', '#todoView input.todoCheckbox', function (e) {
        var selectedRow = $(this).parent().parent().parent();
        var todoIndex = $('#todoView tr').index(selectedRow);

        //check status of check box
        if (this.checked) {
          todoCompleted(todoIndex);
          $(selectedRow).parent().append(selectedRow);
        } else {
          todoInCompleted(todoIndex);
          $(selectedRow).insertBefore($(selectedRow).parent().children().first());
        }

      })
    .on('click','#todoView button.editToDo',function(e){
      $('#todoView').css('width','70%');
    });

  });

  function addNewToDo() {
    var todoTitle = $('#inputNewToDo ').val(),
      category = 'Home ',
      currentDate = new Date().toDateString(),
      todoList = dataJSON[currentDate] || [];

    if (!dataJSON[currentDate])
      todoList = dataJSON[currentDate] = [];
    if (todoTitle.length === 0)
      return;

    var newToDo = todo.createNewToDo(todoTitle, category);
    todoList.push(newToDo);
    $('#inputNewToDo ').val('');
    saveData();
    populateView(todoList);
  }

  function removeTodo(index) {
    var currentDate = new Date().toDateString(),
      todoList = dataJSON[currentDate] || [];

    todoList.splice(todoList.length - (index + 1), 1);
    saveData();
  }

  function todoCompleted(index) {
    var currentDate = new Date().toDateString(),
      todoList = dataJSON[currentDate] || [],
      selectedTodo = todoList[todoList.length - (index + 1)],
      updatedInfo = {};

    updatedInfo.completionTime = new Date().toLocaleTimeString();
    updatedInfo.status = 'Completed';

    todo.updateToDo(selectedTodo, updatedInfo);
    todoList.splice(todoList.length - (index + 1), 1);
    todoList.unshift(selectedTodo);
    saveData();
  }

  function todoInCompleted(index) {
    var currentDate = new Date().toDateString(),
      todoList = dataJSON[currentDate] || [],
      selectedTodo = todoList[todoList.length - (index + 1)],
      updatedInfo = {};

    updatedInfo.status = 'Pending';

    todo.updateToDo(selectedTodo, updatedInfo);
    todoList.splice(todoList.length - (index + 1), 1);
    todoList.push(selectedTodo);
    saveData();
  }

  function saveData() {
    FileUtils.writeText(dataFile, JSON.stringify(dataJSON));
  }


});