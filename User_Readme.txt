
  So geht's:

  Option 1: Terminal (empfohlen)

  cd C:\Users\r.scafarti\Desktop\Gridwalker
  claude
  Fertig. Ich erkenne den Ordner und lade die Memory automatisch.

  Option 2: Direkt von überall

  claude --cwd C:\Users\r.scafarti\Desktop\Gridwalker

  Option 3: VS Code

  1. Öffne den Ordner Gridwalker in VS Code
  2. Starte Claude Code im Terminal (oder über die Extension)
  3. Memory wird automatisch geladen weil das Working Directory stimmt

  ---
  Warum funktioniert das? Die Memory liegt in:
  C:\Users\r.scafarti\.claude\projects\C--Users-r-scafarti-Desktop-Gridwalker\memory\
  Claude Code erkennt automatisch anhand deines Working Directory (Desktop\Gridwalker) welche Memory geladen wird.
  Du musst nichts extra machen.