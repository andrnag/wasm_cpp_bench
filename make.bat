call D:\_sys\emsdk\emsdk_env.bat
em++.bat  main.cpp --bind -O2 -s WASM=1 -s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_MEMORY=134217728 -o main.js
rem em++.bat  main.cpp --bind -s WASM=1 -s DEMANGLE_SUPPORT=1 -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_MEMORY=134217728 -g4 --source-map-base http://localhost/ -o main.js