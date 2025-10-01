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
- **Frontend**: React 19.1 with TypeScript 5.9, Material-UI 7.3, Vite 7.1 for fast builds
- **Backend**: Electron 38.2 with Node.js native module support (serialport, usb)
- **Build System**: Electron Forge 7.9 with cross-platform distribution (Windows/Mac/Linux)
- **Development**: Hot reload with Vite dev server, strict TypeScript checking
- **Updates**: Electron-updater with automatic background updates and GitHub releases
- **Communication**: Typed IPC channels between renderer and main processes

**Hardware Integration:**
- SAMD21 ARM Cortex-M0+ microcontroller support with USB/serial protocols
- Custom bootloader protocol for field firmware updates over USB
- Multi-servo PWM control with precise 10Hz timing and 0.1s resolution
- 434MHz RF communication for wireless remote control (50ft range)
- Compatible with various servo-based robot kits and educational platforms

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

## Development

### Setup
```bash
# Install dependencies
pnpm install

# Development server (hot reload)
pnpm dev

# Type checking
pnpm type-check        # Renderer process (React/TypeScript)
pnpm type-check-main   # Main process (Electron/Node.js)

# Build for production
pnpm build

# Package application
pnpm package           # Package only
pnpm make             # Create distributables

# Platform-specific builds
pnpm win              # Windows installer
pnpm mac              # macOS app bundle
pnpm linux            # Linux AppImage
```

### Architecture

**TypeScript Configuration:**
- `tsconfig.json` - Renderer process (React, DOM types, bundler resolution)
- `tsconfig-main.json` - Main process (Node.js types, CommonJS modules)
- Strict type checking enabled with domain types for Servo, Position, Sequence, Robot

**Build Pipeline:**
- **Vite** - Fast renderer builds with hot reload (400ms startup)
- **Electron Forge** - Cross-platform packaging and distribution
- **Native Modules** - Rebuilt automatically for Electron runtime (serialport, usb)

## Dependencies

**Core Framework:**
- React 19.1.1 with TypeScript 5.9.3
- Electron 38.2.0 with Node.js 22.19.0
- Vite 7.1.7 for fast development builds
- Electron Forge 7.9.0 for packaging and distribution

**UI & UX:**
- Material-UI 7.3.2 (components and theming)
- @hello-pangea/dnd 18.0.1 (drag-and-drop sequences)
- framer-motion 12.23.22 (animations and transitions)
- @emotion/react 11.14.0 (CSS-in-JS styling)

**Hardware Communication:**
- serialport 13.0.0 (USB/serial communication with robots)
- usb 2.16.0 (USB device detection and enumeration)
- electron-updater 6.6.2 (automatic application updates)