# dmgbuild settings: the installer window with the app, an Applications shortcut and the arrow.
import os
app = defines['app']
format = 'UDZO'
files = [app]
symlinks = {'Applications': '/Applications'}
icon = defines['icon']
background = defines['background']
window_rect = ((200, 120), (640, 400))
icon_size = 112
text_size = 14
show_status_bar = False
show_tab_view = False
show_toolbar = False
show_pathbar = False
show_sidebar = False
icon_locations = {os.path.basename(app): (170, 200), 'Applications': (470, 200)}
