# MTM Composer

Desktop application for programming children's magic trick robots. MTM Composer provides an intuitive drag-and-drop interface for creating robotic magic performances, designed specifically for ages 6-12 to learn programming through visual sequencing rather than traditional coding.

## Key Features

- **Visual Programming Interface**: Drag-and-drop sequence builder for creating magic trick performances from simple 3-step routines to complex multi-minute shows
- **Servo Control**: Precise control of individual servo motors with real-time feedback and 0.1-second timing precision
- **Firmware Management**: Built-in firmware upload system for MTM controller boards via custom bootloader protocol
- **USB Communication**: Direct USB communication with SAMD21-based MTM controller boards
- **Remote Control Support**: Integration with 434MHz keyfob remote controls (50ft range) for wireless performance triggering
- **Audio Feedback**: Rich sound effects and audio cues for enhanced user experience and accessibility
- **Cross-Platform**: Available for Windows, macOS, and Linux with code signing and notarization
- **Auto-Updates**: Automatic application updates with built-in updater system
- **Admin Mode**: Advanced features for educators and administrators
- **YouTube Integration**: Embedded assembly instruction videos for robot kits

## Magic Trick Focus

Specifically designed for children's magic trick robot performances, supporting:
- **Individual Learning**: Home practice and creativity development
- **Classroom Instruction**: STEM education through magic and robotics
- **Performance Ready**: Reliable operation for actual magic shows and presentations
- **Multiple Contexts**: After-school programs, robotics clubs, and educational entertainment

## Technical Architecture

**Desktop Application:**
- Electron framework with React and Material-UI
- Custom USB/serial communication protocols
- Professional build pipeline with code signing
- Automatic update system with version management

**Hardware Integration:**
- SAMD21 ARM Cortex-M0+ microcontroller support
- Custom bootloader protocol for field firmware updates
- Multi-servo PWM control with precise timing
- 434MHz RF communication for wireless remote control
- Compatible with various servo-based robot kits

**Sequence Engine:**
- Frame-based automation with 10Hz precision
- Three action types: Move (servo positioning), Delay (timing), Wait (remote trigger)
- Drag-and-drop timeline interface
- Real-time preview and testing capabilities

## Educational Value

Combines STEM learning with creative expression:
- **Programming Concepts**: Sequence logic, timing, and cause-and-effect
- **Problem Solving**: Debugging performances and optimizing movements
- **Creativity**: Designing unique magic tricks and performances
- **Presentation Skills**: Building confidence through magic show performances
- **Technical Skills**: Understanding robotics, servos, and automation

## System Requirements

- **Age Range**: Designed for children ages 6-12 (with adult supervision for younger children)
- **Hardware**: MTM controller board with SAMD21 microcontroller
- **Connectivity**: USB port for programming, optional 434MHz keyfob for wireless control
- **Robot Kits**: Compatible with various servo-based educational robot kits

## Dependencies

- React 19
- Electron 37
- Material-UI 7
- @hello-pangea/dnd (drag-and-drop)
- framer-motion (animations)
- SerialPort (hardware communication)
- USB (device detection)
- electron-updater (automatic updates)