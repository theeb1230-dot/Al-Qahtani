# TV details focus parity

This change removes a duplicate TV play focus target from episode rows and gives the TV details surface two deterministic actions per playable episode:

1. episode tile / OK = play;
2. explicit download button = download.

Both controls use persistent `FocusNode`s owned by `DetailsPage`, so returning from the player can still restore focus to the episode tile while download remains independently reachable by remote traversal. Mobile keeps the existing compact trailing play/download actions.

Regression coverage lives in `flutter_app/test/details_page_focus_test.dart` and runs in both default/mobile and `AL_QAHTANI_TARGET=tv` test passes.
