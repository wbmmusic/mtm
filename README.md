# MTM Composer

Desktop application for programming children's magic trick robots. MTM Composer provides an intuitive drag-and-drop interface for creating robotic magic performances, designed specifically for ages 6-12 to learn programming through visual sequencing rather than traditional coding.

## How It Works

Children create magic trick sequences using three types of actions:

1. **MOVE Actions**: Robot positions created by adjusting servo sliders (0-180°)
2. **DELAY Actions**: Timing pauses (.2s to 5s) for dramatic effect
3. **WAIT Actions**: Pauses until keyfob remote button is pressed

Sequences execute at exactly 10Hz (0.1s precision) and can range from simple 3-step routines to complex 50+ action performances.

## Key Features

- **Visual Programming Interface**: Drag-and-drop sequence builder with audio feedback for enhanced user experience
- **Servo Position Creator**: Modal with sliders for creating robot positions with real-time feedback
- **Precise Timing Control**: 0.1-second timing precision for professional magic trick performances
- **Firmware Management**: Automatic firmware updates via custom bootloader protocol
- **USB Communication**: Direct communication with SAMD21-based MTM controller boards
- **Remote Control Integration**: 3-4 button 434MHz keyfob support (50ft range) for wireless triggering
- **Offline Sequence Creation**: Build sequences without robot connection, upload when ready
- **Cross-Platform**: Available for Windows, macOS, and Linux with code signing
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

## Typical Workflow

1. **Create Positions**: Use servo sliders to define robot poses ("Magic Wand Up", "Box Open")
2. **Build Sequence**: Drag MOVE, DELAY, and WAIT actions into timeline
3. **Test Performance**: Use transport controls to preview magic trick
4. **Upload to Robot**: Send sequence for standalone performance with keyfob control
5. **Perform Magic**: Robot executes sequence independently, triggered by remote

## Educational Value

Combines STEM learning with creative expression:
- **Programming Concepts**: Sequence logic, timing, and cause-and-effect relationships
- **Problem Solving**: Debugging performances and optimizing robot movements
- **Creativity**: Designing unique magic tricks and dramatic performances
- **Presentation Skills**: Building confidence through magic show performances
- **Technical Skills**: Understanding robotics, servos, and automation principles

## Error Handling & Reliability

**Current Status**: Code review identified areas needing improvement for child-friendly error handling:
- USB connection status monitoring with clear visual indicators
- Graceful handling of robot disconnection during sequence creation
- User-friendly error messages instead of console logging
- Validation for sequence names and servo positions
- Recovery options when operations fail

**Planned Improvements**: Enhanced error handling to ensure smooth experience for young users.

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