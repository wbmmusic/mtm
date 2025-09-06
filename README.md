# MTM Composer

Desktop application for programming and controlling educational robotics platforms. MTM Composer provides an intuitive drag-and-drop interface for creating robotic movement sequences and managing servo-based educational robots.

## Key Features

- **Visual Programming Interface**: Drag-and-drop sequence builder for creating complex robotic movements
- **Servo Control**: Precise control of individual servo motors with real-time feedback
- **Firmware Management**: Built-in firmware upload and update system for connected devices
- **USB Communication**: Direct USB and serial port communication with educational robotics hardware
- **Audio Feedback**: Sound effects and audio cues for enhanced user experience
- **Cross-Platform**: Available for Windows, macOS, and Linux
- **Auto-Updates**: Automatic application updates with built-in updater system
- **Admin Mode**: Advanced features for educators and administrators

## Architecture

Electron desktop application built with React and Material-UI. Features custom USB/serial communication protocols for direct hardware control, firmware management system, and professional-grade build pipeline with code signing and notarization.

## Educational Focus

Designed specifically for educational environments, providing students and educators with tools to program servo-based robots through an intuitive visual interface rather than traditional text-based coding.

## Dependencies

- React
- Electron
- Material-UI
- @hello-pangea/dnd
- framer-motion
- SerialPort
- USB
- electron-updater