#!/usr/bin/env gjs

'use strict';

imports.gi.versions.Gtk = '3.0';
const { Gio, Gtk, Gdk, GLib } = imports.gi;

function getCurrentPath() {
  let stack = (new Error()).stack;
  let stackLine = stack.split('\n')[1];
  if (!stackLine) throw new Error('Could not find current file');
  let match = new RegExp('@(.+):\\d+').exec(stackLine);
  if (!match) throw new Error('Could not find current file');
  let path = match[1];
  let file = Gio.File.new_for_path(path);
  return file.get_parent().get_path();
}
const APPLICATION_DIR = getCurrentPath();

class AppWindow {
  constructor(app) {
    let builder = new Gtk.Builder();
    builder.add_from_file('main.glade');
    this._window = builder.get_object('window');
    this._window.set_application(app);
    this._window.connect('delete-event', this.quit_event.bind(this));
    try { this._window.set_icon_from_file(APPLICATION_DIR + '/black.svg'); } // Setting app icon
    catch(err) { this._window.set_icon_name('application-x-executable'); }   // Fallback app icon
    this._window.connect('key-press-event', this.key_press_event.bind(this));
    this._window.fullscreen();
    
    // Set opacity
    this._window.realize(); // Must realize window, then you can get Gdk.Window!
    // Get Gdk.Window and set opacity
    if (ARGV[1] == "transparent") this._window.get_window().set_opacity(0);
    else this._window.get_window().set_opacity(1);
    
    // Background color black
    let css_provider = Gtk.CssProvider.new();
    css_provider.load_from_path("black.css");
    let style_context = this._window.get_style_context();
    style_context.add_provider(css_provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
    
    // Hide mouse cursor
    this.set_cursor("none");
  }
  
  set_cursor(cursor_name) {
    let gdk_window = this._window.get_window();
    if (gdk_window == null) {
      this._window.realize();
      gdk_window = this._window.get_window();
    }
    let my_display = gdk_window.get_display();
    let my_cursor = Gdk.Cursor.new_from_name(my_display, cursor_name);
    gdk_window.set_cursor(my_cursor);
  }
  
  quit_event() {
    this.set_cursor("default");
    return false;
  }
  
  quit() {
    this.quit_event();
    application.quit();
  }
  
  key_press_event(widget, event) {
    let key_escape = 65307;
    let [symbol, keyval] = event.get_keyval();
    if (keyval == key_escape) this.quit();
  }
}

ARGV.unshift(imports.system.programInvocationName); //GTK Libraries (C++) expects ARGV[0] = Application name

GLib.set_prgname("Black");
const application = new Gtk.Application({
    application_id: 'org.gtk.'+GLib.get_prgname(),
    flags: Gio.ApplicationFlags.FLAGS_NONE
});

application.connect('activate', (app) => {
    let mainWindow = app.activeWindow;
    if (!mainWindow) mainWindow = (new AppWindow(app))._window;
    mainWindow.present();
});

application.run(null);
