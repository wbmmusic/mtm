# MTM Composer

Desktop appl📖 **[Complete User Guide](docs/USER-GUIDE.md)** - Comprehensive documentation for creating positions, building sequences, playback controls, reordering actions, and uploading to robots.

## Recent Improvements

### Documentation & User Experience (October 2025)

- ✅ **Comprehensive Code Documentation**: Added 4,000+ lines of detailed inline comments across all major components
- ✅ **Complete User Guide**: Created comprehensive [USER-GUIDE.md](docs/USER-GUIDE.md) with step-by-step instructions
- ✅ **Improved Font Readability**: Enhanced robot card typography - increased servo count text size from 9px to 12px
- ✅ **Enhanced Architecture Documentation**: Detailed system architecture with component hierarchy and data flow diagrams
- ✅ **API Documentation**: Complete IPC communication protocols and component interface documentation
- ✅ **Developer Experience**: Added development setup guides and coding best practices

### UI/UX Improvements

- **Better Typography**: Robot names use h5 variant with explicit 16px sizing for consistency
- **Readable Servo Counts**: Increased font size and switched to "Bit" monospace font for better clarity
- **Comprehensive Tooltips**: Enhanced user guidance throughout the interface

## Magic Trick Focustion for programming children's magic trick robots. MTM Composer provides an intuitive drag-and-drop interface for creating robotic magic performances, designed specifically for ages 6-12 to learn programming through visual sequencing rather than traditional coding.

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

📖 **[Complete User Guide](docs/USER-GUIDE.md)** - Comprehensive documentation for creating positions, building sequences, playback controls, reordering actions, and uploading to robots.

## Magic Trick Focus

Specifically designed for children's magic trick robot performances, supporting:

- **Individual Learning**: Home practice and creativity development
- **Classroom Instruction**: STEM education through magic and robotics
- **Performance Ready**: Reliable operation for actual magic shows and presentations
- **Multiple Contexts**: After-school programs, robotics clubs, and educational entertainment

## Technical Architecture

### Application Stack

**Frontend:**

- **React 19.1**: Modern functional components with hooks for state management
- **TypeScript 5.9**: Strict type checking for enhanced code quality and IntelliSense
- **Material-UI 7.3**: Component library with comprehensive custom theming system
- **Vite 7.1**: Lightning-fast build system with hot module replacement
- **React Router**: Client-side navigation with nested routing support
- **React Beautiful DnD**: Drag-and-drop interface for sequence timeline editing

**Desktop Framework:**

- **Electron 38.2**: Cross-platform desktop framework with Node.js integration
- **Electron Forge 7.9**: Build system with cross-platform packaging and distribution
- **Native Modules**: serialport and usb for direct hardware communication
- **Auto Updates**: electron-updater with GitHub releases integration
- **Security**: contextBridge and preload scripts for secure IPC communication

**Hardware Integration:**

- **SAMD21 ARM Cortex-M0+**: Primary microcontroller with USB/serial communication
- **Custom Bootloader**: Field-updatable firmware with USB protocol
- **Multi-Servo Control**: PWM control with 10Hz precision timing
- **Remote Control**: 434MHz keyfob integration with 50ft range

### Component Architecture

```
App (Main Container)
├── GlobalContext (State Management)
├── ScaleContext (DPI Scaling)
├── Router Configuration
│   ├── Home (Robot Selection)
│   │   ├── RobotCard[] (Robot Grid)
│   │   └── EditRobotModal (Robot CRUD)
│   ├── Robot/:robotPath (Robot Overview)
│   │   ├── SequencePicker (Sequence Management)
│   │   └── YouTube Integration (Assembly Videos)
│   └── Sequence/:robotPath/:sequenceId (Sequence Editor)
│       ├── Sequence (Main Editor)
│       │   ├── DragDropContext (Timeline Interface)
│       │   ├── EditPositionModal (Servo Position Creator)
│       │   ├── SelectPositionModal (Position Browser)
│       │   └── ConfirmDeleteModals (Safety Dialogs)
│       └── Transport (Playback Controls)
│           ├── Timeline Slider (Scrubbing Interface)
│           ├── Playback Controls (Play/Pause/Stop/Repeat)
│           └── Upload Interface (Robot Communication)
```

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │◄──►│ Electron Main   │◄──►│ Hardware Layer  │
│                 │    │                 │    │                 │
│ • UI Components │    │ • IPC Handlers  │    │ • USB Protocol  │
│ • State Mgmt    │    │ • File Storage  │    │ • Servo Control │
│ • Type Safety   │    │ • USB Comms     │    │ • Remote Input  │
│ • Theme System  │    │ • Audio System  │    │ • Firmware Mgmt │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │ Context │             │   IPC   │             │  Robot  │
    │ Bridge  │             │ Channel │             │ Protocol│
    │ (Secure)│             │  Types  │             │ Packets │
    └─────────┘             └─────────┘             └─────────┘
```

### Styling System Architecture

**Theme Foundation:**

- **mtmTheme**: Base Material-UI theme with retro gaming aesthetic
- **RetroColors**: Comprehensive color palette (primary yellow, accent colors)
- **Typography**: Pixel-perfect fonts (Arcade, Bit, Video, Seven Segment)
- **Component Overrides**: Custom MUI component styling for consistent look

**Dynamic Scaling System:**

- **ScaleContext**: Provides DPI-aware theme scaling across different monitors
- **Display Monitoring**: Real-time detection of display configuration changes
- **Inverse Scaling**: Maintains consistent visual appearance regardless of system DPI
- **Theme Generation**: Creates scaled theme instances with adjusted fonts and spacing

**Styled Components Library:**

- **Typography**: RetroTitle, PixelText, SevenSegmentDisplay with themed styling
- **Interactive**: RetroButton, DangerButton with 3D shadow effects and animations
- **Containers**: DroppableContainer, SectionContainer, HeaderBar with consistent borders
- **Modals**: RetroConfirmModal system replacing native browser dialogs
- **Progress**: RetroProgressBar with themed styling and animations

### State Management

**Global State (GlobalContext):**

- USB connection status and device management
- Admin mode permissions and feature access
- Global timeline length for sequence synchronization
- Error handling and user feedback systems

**Local Component State:**

- Sequence editing with undo/redo capabilities
- Position creation and modification workflows
- Modal dialog visibility and state management
- Drag-and-drop operation handling

**IPC Communication:**

- Type-safe channels with compile-time validation
- Async/await pattern for all main process communication
- Error boundaries and graceful failure handling
- Automatic JSON serialization/deserialization

### Security Model

**Process Isolation:**

- Main process handles all file system and hardware operations
- Renderer process limited to UI logic and user interaction
- No direct Node.js API access from frontend code
- All communication through secure contextBridge

**Type Safety:**

- Comprehensive TypeScript interfaces for all data structures
- IPC channel type mapping for compile-time validation
- Strict null checking and error handling
- Runtime type validation for critical operations
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

### Prerequisites

- **Node.js 18+**: LTS version recommended for stability
- **pnpm**: Preferred package manager for performance and workspace support
- **Git**: Version control and development workflow
- **VS Code**: Recommended IDE with TypeScript and React extensions

### Setup

```bash
# Clone repository
git clone [repository-url]
cd mtm-app

# Install dependencies (uses pnpm workspaces)
pnpm install

# Development server with hot reload
pnpm dev

# Type checking (run in separate terminals)
pnpm type-check        # Renderer process (React/TypeScript)
pnpm type-check-main   # Main process (Electron/Node.js)

# Build for production
pnpm build

# Package for distribution
pnpm make
```

### Project Structure

```
mtm-app/
├── src/                          # Renderer process (React frontend)
│   ├── components/               # React components organized by feature
│   │   ├── robot/               # Robot management components
│   │   ├── sequence/            # Sequence editor components
│   │   └── styled/              # Styled components library
│   ├── contexts/                # React contexts for global state
│   ├── theme/                   # Material-UI theme configuration
│   ├── types/                   # TypeScript type definitions
│   ├── helpers.ts               # IPC communication utilities
│   └── ipc-types.ts            # Type-safe IPC channel definitions
├── public/                      # Main process files (Electron backend)
│   ├── main.ts                 # Electron main process entry point
│   ├── preload.ts              # Secure IPC bridge and context isolation
│   ├── ipc.ts                  # IPC handler implementations
│   ├── usb.ts                  # USB communication and protocol handling
│   ├── msgMaker.ts             # Robot protocol message generation
│   └── firmware.ts             # Firmware update and bootloader protocol
├── art/                        # Application icons and visual assets
├── docs/                       # Technical documentation
└── dist-electron/              # Built Electron files (generated)
```

### Development Workflow

**Code Organization:**

- **Feature-Based**: Components grouped by functionality (robot, sequence, styled)
- **Type Safety**: Comprehensive TypeScript coverage with strict checking
- **Modular Architecture**: Clear separation between UI, state, and communication
- **Consistent Styling**: Centralized theme system with styled components

**Development Commands:**

```bash
# Start development environment
pnpm dev                    # Full application with hot reload

# Testing and validation
pnpm type-check            # TypeScript compilation check
pnpm lint                  # Code quality and style checking
pnpm build                 # Production build verification

# Distribution
pnpm make                  # Package for current platform
pnpm publish               # Create GitHub release (maintainers)
```

**Code Quality Standards:**

- **TypeScript Strict Mode**: Full type coverage with strict null checks
- **Component Documentation**: Comprehensive inline comments for all components
- **IPC Type Safety**: Compile-time validation for all inter-process communication
- **Error Handling**: Graceful error boundaries and user-friendly messages
- **Performance**: Optimized rendering with React.memo and useMemo where appropriate

**Architecture Patterns:**

- **Functional Components**: Modern React with hooks-based state management
- **Context Providers**: Global state management without external dependencies
- **IPC Abstraction**: Type-safe wrappers for all Electron communication
- **Theme Composition**: Dynamic theming with Material-UI and custom components
- **Security First**: All main process communication through secure contextBridge
  pnpm package # Package only
  pnpm make # Create distributables

# Platform-specific builds

pnpm win # Windows installer
pnpm mac # macOS app bundle
pnpm linux # Linux AppImage

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
```
