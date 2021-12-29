# Change Log

All notable changes to the "hex-viewer" extension will be documented in this file.

## [Unreleased]
### Changed
- Editor webview is suspended instead of unloaded when switching to another tab (requires more memory but otherwise would always reload the data, which takes a moment, and loose context like scroll position)
### Fixed
- Opening a new editor view from another active view of this extension would result in a wrong state and not show the decoder selection status bar item

## [0.2.2] - 2021-12-22
### Changed
- Working dir inside custom decoder scripts is now relative to the workspace the script is in, or relative to the script itself for scripts specified by absolute path
- Make `text` property of `DecodedValue` objects optional
### Added
- Builtin decoders for UTF-16

## [0.2.1] - 2021-12-21
### Changed
- Working dir inside custom decoder scripts is now relative to the script itself
### Added
- Pass file URI to custom decoder functions
### Fixed
- Selecting and deselecting multibyte cells

## [0.2.0] - 2021-12-20
### Added
- Basic cell selection
### Fixed
- Opening larger files

## [0.1.1] - 2021-12-14
### Fixed
- Custom decoder reloading

## [0.1.0] - 2021-12-13
- Initial release
