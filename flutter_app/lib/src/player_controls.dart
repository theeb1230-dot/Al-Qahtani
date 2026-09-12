import 'package:flutter/material.dart';

class PlayerControls extends StatefulWidget {
  const PlayerControls({
    super.key,
    required this.isPlaying,
    required this.isTv,
    required this.onRewind,
    required this.onTogglePlay,
    required this.onForward,
  });

  final bool isPlaying;
  final bool isTv;
  final VoidCallback onRewind;
  final VoidCallback onTogglePlay;
  final VoidCallback onForward;

  @override
  State<PlayerControls> createState() => _PlayerControlsState();
}

class _PlayerControlsState extends State<PlayerControls> {
  final FocusNode _rewindFocus = FocusNode(debugLabel: 'player-rewind');
  final FocusNode _playFocus = FocusNode(debugLabel: 'player-play');
  final FocusNode _forwardFocus = FocusNode(debugLabel: 'player-forward');

  @override
  void dispose() {
    _rewindFocus.dispose();
    _playFocus.dispose();
    _forwardFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FocusTraversalGroup(
      policy: WidgetOrderTraversalPolicy(),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton.filledTonal(
            key: const Key('player-rewind'),
            focusNode: _rewindFocus,
            tooltip: 'رجوع 10 ثوانٍ',
            onPressed: widget.onRewind,
            icon: const Icon(Icons.replay_10),
          ),
          const SizedBox(width: 12),
          IconButton.filled(
            key: const Key('player-play-toggle'),
            focusNode: _playFocus,
            autofocus: widget.isTv,
            tooltip: widget.isPlaying ? 'إيقاف مؤقت' : 'تشغيل',
            onPressed: widget.onTogglePlay,
            icon: Icon(widget.isPlaying ? Icons.pause : Icons.play_arrow),
          ),
          const SizedBox(width: 12),
          IconButton.filledTonal(
            key: const Key('player-forward'),
            focusNode: _forwardFocus,
            tooltip: 'تقديم 10 ثوانٍ',
            onPressed: widget.onForward,
            icon: const Icon(Icons.forward_10),
          ),
        ],
      ),
    );
  }
}
