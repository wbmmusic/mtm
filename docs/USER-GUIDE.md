# MTM Composer User Guide

## Table of Contents
- [Getting Started](#getting-started)
- [Creating Robot Positions](#creating-robot-positions)
- [Building Sequences](#building-sequences)
- [Playing Back Sequences](#playing-back-sequences)
- [Reordering Actions](#reordering-actions)
- [Uploading to Robot](#uploading-to-robot)
- [Tips and Tricks](#tips-and-tricks)

## Getting Started

### Selecting a Robot
1. Launch MTM Composer
2. Select your robot from the robot grid on the home screen
3. Click on a robot card to enter the robot workspace

### Understanding the Interface
- **Robot Overview**: Shows robot details and available sequences
- **Sequence Editor**: Drag-and-drop interface for building magic trick routines
- **Transport Controls**: Play, pause, stop, and upload sequences

---

## Creating Robot Positions

**Positions** are snapshots of servo angles that define where your robot's parts should be at specific moments.

### Step-by-Step Guide:
1. **Access Position Creator**: In the sequence editor, click the "+" button or "Create Position"
2. **Name Your Position**: Give it a descriptive name (e.g., "Arms Up", "Box Open", "Reveal")
3. **Set Servo Angles**: Use the sliders to adjust each servo (0-180 degrees)
   - **0°**: Fully counterclockwise
   - **90°**: Middle position  
   - **180°**: Fully clockwise
4. **Test the Position**: Click "Test" to see the robot move to this position
5. **Save**: Click "Save Position" to add it to your position library

### Position Tips:
- **Start Simple**: Create basic positions first (home, open, closed)
- **Test Frequently**: Always test positions before saving
- **Descriptive Names**: Use clear names that describe what the robot looks like
- **Safety First**: Ensure positions don't cause mechanical stress

---

## Building Sequences

Sequences are the heart of MTM magic tricks - they're ordered lists of actions that create performances.

### Three Types of Actions:

#### 1. MOVE Actions 🤖
- **Purpose**: Make the robot move to a specific position
- **How to Add**: Drag a position from the left panel to the timeline
- **Duration**: Instant (robot moves as fast as possible)
- **Example**: Move to "Box Open" position

#### 2. DELAY Actions ⏱️
- **Purpose**: Create dramatic pauses in your routine
- **Options**: 0.2s, 0.5s, 1s, 2s, 3s, 5s
- **How to Add**: Drag a delay from the left panel to the timeline
- **Example**: 2-second pause for audience suspense

#### 3. WAIT Actions 🎮
- **Purpose**: Pause until a remote control button is pressed
- **How to Add**: Drag a wait action from the left panel to the timeline
- **Performance**: Allows audience interaction or performer control
- **Example**: Wait for remote button press to reveal the magic

### Building Your First Sequence:

1. **Create a New Sequence**:
   - Click "New Sequence" from the robot overview
   - Give it a descriptive name (e.g., "Coin Vanish Trick")

2. **Plan Your Magic Trick**:
   - Think about the story: setup → action → reveal
   - Identify key positions needed
   - Plan timing for maximum impact

3. **Drag Actions to Timeline**:
   - Start with a "home" position
   - Add delays for dramatic effect
   - Include wait actions for audience interaction
   - End with a revealing finale

4. **Example Sequence** (Simple Coin Trick):
   ```
   1. MOVE → "Hand Closed" (hide coin)
   2. DELAY → 1 second (build suspense)
   3. WAIT → Remote Button (audience ready?)
   4. MOVE → "Hand Open" (reveal empty hand)
   5. DELAY → 2 seconds (let audience see)
   6. MOVE → "Reveal Coin" (show coin elsewhere)
   ```

---

## Playing Back Sequences

The **Transport Controls** let you test and refine your sequences before performing.

### Transport Controls Explained:

#### Timeline Slider 📍
- **Scrub Through Time**: Click and drag to jump to any point in your sequence
- **Visual Markers**: See exactly when each action occurs
- **Real-Time Position**: Shows current playback location

#### Playback Buttons:
- **▶️ Play/Pause**: Start or pause sequence playback
- **⏹️ Stop**: Stop playback and return to beginning
- **🔄 Repeat**: Toggle looping (sequence repeats automatically)

#### Time Display:
- Shows **current time / total duration** in seconds
- Updates in real-time during playback
- Helps you time your performance

### Testing Your Sequence:

1. **Connect Your Robot**: Ensure USB connection is active
2. **Click Play**: Watch your sequence execute step by step
3. **Use Timeline**: Scrub to test specific parts
4. **Check Timing**: Verify delays feel natural for performance
5. **Test Waits**: Press remote buttons to ensure proper response

### Playback Tips:
- **Start Slow**: Use longer delays while learning
- **Practice Timing**: Get comfortable with the rhythm
- **Test Edge Cases**: What happens if robot gets stuck?
- **Audience Perspective**: Watch from where audience will sit

---

## Reordering Actions

Drag-and-drop makes it easy to rearrange your sequence for perfect timing.

### How to Reorder:

1. **Select Action**: Click on any action in the timeline
2. **Drag to New Position**: Hold and drag left or right
3. **Visual Feedback**: 
   - **Blue highlight**: Shows valid drop zones
   - **Audio cue**: Confirmation sound when dropped
4. **Auto-Save**: Changes are saved automatically

### Reordering Strategies:

#### Fine-Tuning Performance:
- **Move delays** to create better pacing
- **Reposition waits** for optimal audience interaction
- **Group related moves** for smoother flow

#### Common Adjustments:
- **Add opening delay**: Give audience time to focus
- **Extend reveals**: Let magic moments sink in
- **Optimize transitions**: Minimize awkward robot movements

#### Advanced Techniques:
- **Misdirection sequences**: Position moves to guide attention
- **Timing variations**: Alternate fast and slow sections
- **Climax building**: Arrange actions for maximum impact

### Drag-and-Drop Tips:
- **Audio Feedback**: Listen for confirmation sounds
- **Undo Available**: Use Ctrl+Z if you make mistakes
- **Preview Changes**: Play sequence after reordering
- **Save Versions**: Consider duplicating sequences before major changes

---

## Uploading to Robot

Once your sequence is perfect, upload it to the robot for standalone performance.

### Upload Process:

1. **Final Testing**: Ensure sequence works perfectly in preview
2. **Connect Robot**: Verify USB connection (green indicator)
3. **Click Upload**: Press the "Upload" button in transport controls
4. **Wait for Confirmation**: Robot will indicate successful upload
5. **Disconnect**: Robot can now perform independently

### Robot Memory:
- **Single Sequence**: Robot stores one sequence at a time
- **Overwrites Previous**: New uploads replace old sequences
- **Persistent Storage**: Sequence survives power cycles
- **Remote Triggering**: Use keyfob to start performance

### Performance Mode:

Once uploaded, your robot becomes a **standalone performer**:

#### Remote Control Operation:
- **Start**: Press remote button to begin sequence
- **Emergency Stop**: Robot stops if remote pressed during performance
- **Repeat**: Some sequences can loop automatically
- **Range**: 50+ foot remote control range

#### Professional Tips:
- **Battery Life**: Ensure robot is fully charged before shows
- **Backup Plan**: Always have manual override available
- **Practice**: Rehearse with uploaded sequences
- **Timing**: Account for audience reaction delays

### Upload Troubleshooting:
- **Connection Issues**: Check USB cable and drivers
- **Upload Fails**: Restart robot and try again
- **Sequence Corruption**: Re-upload if robot behaves strangely
- **Memory Full**: Only one sequence can be stored at a time

---

## Tips and Tricks

### Performance Enhancement:
- **Storytelling**: Every sequence should tell a story
- **Audience Engagement**: Use wait actions for interaction
- **Pacing**: Vary timing - don't make everything the same speed
- **Surprise**: Unexpected moves create the best magic moments

### Technical Best Practices:
- **Save Frequently**: Sequences auto-save, but duplicates are wise
- **Test on Hardware**: Always verify on actual robot before shows
- **Battery Management**: Low battery affects servo performance
- **Cable Management**: Keep USB cable out of robot's movement path

### Creative Ideas:
- **Theme Your Tricks**: Create sequences around holidays or events
- **Progressive Difficulty**: Start simple, add complexity over time
- **Combine Tricks**: Chain multiple short sequences for longer shows
- **Customize Positions**: Create unique positions for signature moves

### Troubleshooting Common Issues:
- **Robot Stutters**: Check power supply and USB connection
- **Missed Actions**: Verify all positions are reachable
- **Timing Issues**: Adjust delays for smoother performance
- **Remote Problems**: Check battery and range limitations

### Educational Value:
- **Logic Skills**: Sequences teach cause-and-effect thinking
- **Planning**: Students learn to break complex tasks into steps
- **Debugging**: Finding and fixing sequence problems builds problem-solving skills
- **Creativity**: Open-ended tool encourages innovative magic creation

---

## Keyboard Shortcuts

- **Spacebar**: Play/Pause sequence
- **Escape**: Stop sequence playback
- **Ctrl+S**: Save sequence (auto-save is also active)
- **Ctrl+Z**: Undo last action
- **Ctrl+D**: Duplicate selected action
- **Delete**: Remove selected action

---

## Getting Help

- **Tooltips**: Hover over buttons for quick help
- **Assembly Videos**: Robot-specific build instructions
- **Community**: Share sequences and get inspiration
- **Support**: Contact information for technical issues

Remember: **Magic is about wonder, not perfection.** Even simple sequences can create amazing experiences for audiences!