/**
 * SEQUENCE EDITOR COMPONENT
 * 
 * This is the main sequence editing interface for the MTM robot application.
 * It provides a comprehensive drag-and-drop timeline editor for creating and
 * modifying robot movement sequences.
 * 
 * CORE FUNCTIONALITY:
 * - Visual timeline with draggable actions (moves and waits)
 * - Real-time sequence playback with Transport controls
 * - Position management (create, edit, duplicate, delete)
 * - Sequence metadata editing (name, description, duration)
 * - Drag-and-drop reordering of sequence actions
 * - Integration with robot communication for live testing
 * 
 * KEY FEATURES:
 * - React Beautiful DnD for smooth drag-and-drop interactions
 * - Modal dialogs for editing positions and managing actions
 * - Real-time validation and error handling
 * - Responsive design with retro gaming aesthetic
 * - Automatic sequence saving and state persistence
 * 
 * ARCHITECTURE:
 * - Uses React hooks for state management
 * - Integrates with global context for robot connection
 * - Communicates with main process via IPC for data persistence
 * - Modular design with separate modals for different editing tasks
 */

// React core and utilities
import React, { useEffect, useState, useCallback } from "react";
import { safeSend } from "../../helpers"; // IPC communication wrapper
import { useNavigate, useParams } from "react-router-dom"; // React Router navigation
import { v4 as uuid } from "uuid"; // Unique ID generation for new actions

// Material-UI components
import Box from "@mui/material/Box";
import {
  Stack,        // Flex container with spacing
  Paper,        // Card-like container
  Typography,   // Text components
  TextField,    // Input fields
  Divider,      // Visual separators
  LinearProgress, // Loading indicators
  IconButton,   // Icon-based buttons
  Tooltip,      // Hover information
  Button,       // Standard buttons
} from "@mui/material";

// Custom styled components with retro theme
import { 
  RetroTitle,         // Large pixel-style headers
  PixelText,          // Small pixel-style text
  RetroButton,        // Themed buttons
  DangerButton,       // Warning/delete buttons
  RetroTextField,     // Themed input fields
  DroppableContainer, // Drag-and-drop containers
  SectionContainer,   // Content section wrappers
  HeaderBar,          // Top section bars
  RetroProgressBar,   // Themed progress indicators
  RetroConfirmModal   // Custom confirmation dialogs
} from "../styled";

// Application theme and styling
import { mtmStyles } from "../../theme";

// Material-UI icons
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import SettingsRemoteIcon from "@mui/icons-material/SettingsRemote";
import EditIcon from "@mui/icons-material/Edit";
import ControlPointDuplicateIcon from "@mui/icons-material/ControlPointDuplicate";

// Child components
import { Transport } from "./Transport"; // Playback controls
import { EditPositionModal } from "./EditPositionModal"; // Position editing dialog
import { SelectPositionModal } from "./SelectPositionModal"; // Position selection dialog  
import { ConfirmDeletePositionModal } from "./ConfirmDeletePositionModal"; // Delete confirmation

// Drag and drop functionality
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";

// Data persistence helpers
import {
  createPosition,   // Create new servo position
  deletePosition,   // Remove position from storage
  deleteSequence,   // Remove entire sequence
  getPositions,     // Load all saved positions
  getSequence,      // Load sequence by ID
  saveSequence,     // Persist sequence to storage
  updatePosition,   // Modify existing position
  updateSequence,   // Update sequence metadata
} from "../../helpers";
// Sequence configuration constants
import { delays, waitStates } from "./Constants"; // Predefined timing and wait options

// Type definitions
import { Position as PositionType, Sequence as SequenceType, Servo as ServoType, Action } from "../../types";

// Additional modal components
import { ConfirmDeleteSequenceModal } from "./ConfirmDeleteSequenceModal";

/**
 * TYPE DEFINITIONS FOR MODAL STATE MANAGEMENT
 * 
 * These types define the shape of state objects for various modal dialogs
 * used throughout the sequence editor interface.
 */

// Position editing modal (create new or edit existing positions)
type PositionModalState = { 
  show: boolean;                        // Modal visibility
  mode: "new" | "edit" | null;         // Creation or editing mode
  position: PositionType | null;       // Position being edited (null for new)
};

// Position selection modal (choose from existing positions)
type SelectPositionModalState = { 
  show: boolean;                        // Modal visibility
};

// Position deletion confirmation modal
type DeletePositionModalState = { 
  show: boolean;                        // Modal visibility
  position: PositionType | null;       // Position to be deleted
};

// Sequence deletion confirmation modal
type ConfirmDeleteSequenceModalState = { 
  show: boolean;                        // Modal visibility
  name: string | null;                 // Sequence name for confirmation display
};

// Timeline item representation for drag-and-drop
type TimelineItem = { 
  id: string;                          // Unique identifier for React keys
  appId?: string;                      // Application-specific ID
  content?: string;                    // Display text for the item
  type?: string;                       // Action type (move, wait, etc.)
  servos?: ServoType[];               // Servo positions for move actions
  value?: number;                      // Duration for wait actions
  name?: string;                       // Human-readable name
};

/**
 * DEFAULT STATE VALUES
 * 
 * These constants provide clean initial states for all modal dialogs
 * and core data structures, ensuring consistent initialization.
 */
const defaultPositionModal: PositionModalState = { 
  show: false, 
  mode: null, 
  position: null 
};

const defaultSelectPositionModal: SelectPositionModalState = { 
  show: false 
};

const defaultDeletePositionModal: DeletePositionModalState = { 
  show: false, 
  position: null 
};

const defaultSequence: SequenceType = { 
  appId: uuid(),    // Generate unique ID
  name: "",         // Empty name for new sequences
  actions: []       // Empty action list
} as SequenceType;

const defaultConfirmDeleteSequenceModal: ConfirmDeleteSequenceModalState = { 
  show: false, 
  name: null 
};

/**
 * STYLING CONFIGURATION
 * 
 * Uses centralized theme styling for drag-and-drop containers
 * to maintain consistent visual appearance across the application.
 */
const droppableStyle = mtmStyles.droppable;

/**
 * SEQUENCE COMPONENT DEFINITION
 * 
 * Main functional component for the sequence editor interface.
 * Manages all state for sequence editing, modal dialogs, and drag-and-drop operations.
 */
export const Sequence: React.FC = () => {
  // React Router hooks for navigation and URL parameters
  const navigate = useNavigate();                    // Navigation function
  const { robotPath, sequenceId } = useParams();    // URL parameters

  /**
   * MODAL STATE MANAGEMENT
   * 
   * Each modal dialog has its own state to control visibility and context.
   * This provides fine-grained control over the user interface flow.
   */
  
  // Sequence deletion confirmation modal
  const [confirmDeleteSequenceModal, setConfirmDeleteSequenceModal] = useState<ConfirmDeleteSequenceModalState>(
    defaultConfirmDeleteSequenceModal
  );
  
  // Timeline clearing confirmation modal
  const [showClearTimelineConfirm, setShowClearTimelineConfirm] = useState(false);
  
  // Position editing modal (create/edit positions)
  const [positionModal, setPositionModal] = useState<PositionModalState>(defaultPositionModal);
  
  // Position deletion confirmation modal
  const [deletePositionModal, setDeletePositionModal] = useState<DeletePositionModalState>(
    defaultDeletePositionModal
  );
  
  // Position selection modal (choose existing position)
  const [selectPositionModal, setSelectPositionModal] = useState<SelectPositionModalState>(
    defaultSelectPositionModal
  );

  /**
   * CORE DATA STATE MANAGEMENT
   * 
   * These state variables hold the primary data structures for the sequence editor.
   */
  
  // Timeline items for drag-and-drop interface (null = loading)
  const [timelineObjects, setTimelineObjects] = useState<TimelineItem[] | null>(null);
  
  // Available servo positions (null = loading)
  const [positions, setPositions] = useState<PositionType[] | null>(null);
  
  // Original sequence state for change tracking (null = loading/new)
  const [ogSequense, setOgSequense] = useState<SequenceType | null>(null);
  
  // Positions available in modal contexts (for selection)
  const [modalPositions, setModalPositions] = useState<PositionType[] | null>(null);

  /**
   * SEQUENCE INITIALIZATION HELPER
   * 
   * Determines initial sequence state based on URL parameters:
   * - "newsequenceplaceholder" → Create new empty sequence
   * - Actual sequence ID → Will be loaded from storage later
   * 
   * @returns {SequenceType | null} Initial sequence or null for loading from storage
   */
  const initSequence = () => {
    if (sequenceId === "newsequenceplaceholder") return defaultSequence;
    else return null; // Will be loaded in useEffect
  };

  // Current sequence being edited (null = loading)
  const [sequence, setSequence] = useState<SequenceType | null>(initSequence());

  /**
   * SEQUENCE STATE SYNCHRONIZATION
   * 
   * Updates both current sequence and original sequence states simultaneously.
   * The original sequence is used for change detection and saving logic.
   * Uses deep cloning to prevent reference sharing between states.
   * 
   * @param {SequenceType} seq - The sequence to set as current state
   */
  const setTheSequences = (seq: SequenceType) => {
    setSequence(JSON.parse(JSON.stringify(seq)) as SequenceType);     // Current editable state
    setOgSequense(JSON.parse(JSON.stringify(seq)) as SequenceType);   // Original for comparison
  };

  /**
   * TIMELINE OBJECTS GENERATION
   * 
   * Creates the complete list of draggable items for the timeline interface.
   * Combines predefined items (delays, wait states) with user-created positions.
   * 
   * INCLUDES:
   * - Delay actions: Fixed duration waits (from Constants.ts)
   * - Wait states: Interactive waits for remote control input
   * - Move actions: User-defined servo positions
   * 
   * Each item gets a unique ID for React drag-and-drop operations.
   * 
   * @returns {TimelineItem[]} Complete array of timeline items
   */
  const makeObjects = useCallback(() => {
    // Start with predefined delay and wait actions
    const out: TimelineItem[] = [...delays, ...waitStates] as TimelineItem[];
    
    // Add user-created positions as move actions
    if (positions) {
      positions.forEach((position) => {
        out.push({ 
          id: uuid(),                    // Unique ID for drag-and-drop
          appId: position.appId,         // Reference to position data
          content: position.name,        // Display name
          type: "move",                  // Action type
          servos: position.servos        // Servo position data
        });
      });
    }

    setTimelineObjects(out);
  }, [positions]);

  const loadSequence = useCallback(() => {
    getSequence(robotPath as string, sequenceId as string)
      .then((res: SequenceType) => {
        const tempSeq = JSON.parse(JSON.stringify(res)) as SequenceType;
        tempSeq.actions = (tempSeq.actions || []).map((act) => ({ ...(act as Action), id: uuid() } as Action));
        setTheSequences(tempSeq);
      })
      .catch((err: unknown) => console.log(err));
  }, [robotPath, sequenceId]);

  useEffect(() => {
    // play a sound and load positions when the robotPath changes.
    // Do not call `makeObjects()` here or depend on it: `makeObjects` is
    // memoized and recreates whenever `positions` changes which can cause
    // a render loop (positions -> makeObjects -> effect -> setPositions -> ...).
    safeSend("play", "sequence.mp3");
    getPositions(robotPath as string)
      .then((res: PositionType[]) => setPositions(res))
      .catch((err: unknown) => console.error(err));
  }, [robotPath]);

  useEffect(() => {
    if (sequenceId !== "newsequenceplaceholder") loadSequence();
  }, [sequenceId, loadSequence]);

  useEffect(() => makeObjects(), [makeObjects]);

  const haveEverything = () => {
    if (!sequence || !timelineObjects) return false;
    const acts = (sequence.actions || []) as Action[];
    for (const act of acts) {
      // Check if this action references a timeline object by appId
      if (act.appId) {
        const idx = timelineObjects?.findIndex((obj) => obj.appId === act.appId) ?? -1;
        if (idx < 0) return false;
      }
    }
    return true;
  };

  if (!positions || !sequence || !timelineObjects || !haveEverything()) {
    return <></>;
  }

  const makeOutput = () => {
    const tempSeq = JSON.parse(JSON.stringify(sequence)) as SequenceType;
    (tempSeq.actions || []).forEach((act) => {
      delete (act as any).type;
      delete (act as any).id;
    });
    return tempSeq;
  };

  const sequenceSave = () => {
    if (!sequence) return;
    if (sequenceId !== "newsequenceplaceholder") {
      updateSequence(robotPath as string, makeOutput())
        .then(() => loadSequence())
        .catch((err: unknown) => console.log(err));
    } else {
      saveSequence(robotPath as string, makeOutput())
        .then(() => navigate(`/sequence/${robotPath}/${sequence.appId}`))
        .catch((err: unknown) => console.log(err));
    }
  };

  const sequenceDelete = () => {
    deleteSequence(robotPath as string, makeOutput())
      .then(() => navigate("/robot/" + robotPath))
      .catch((err: unknown) => console.log(err));
  };

  const DelayItem: React.FC<{ itm: TimelineItem }> = ({ itm }) => (
    <Stack height={"100%"} spacing={0.5}>
      <Box textAlign="center">
        <PixelText>
          {itm.content}
        </PixelText>
      </Box>
      <Box height={"100%"} display="flex" alignItems="center" justifyContent="center" px={0.5}>
        <Box 
          height={"16px"} 
          width={`${Math.max((itm.value ?? 0) * 1.5, (itm.value ?? 0) >= 5 ? 4 : 2)}px`} 
          sx={{ 
            backgroundColor: "#ffa500", // orange to match time bar
            border: "1px solid #55533c",
            borderRadius: 0,
          }} 
        />
      </Box>
    </Stack>
  );

  const WaitItem: React.FC<{ itm: TimelineItem }> = ({ itm }) => (
    <Stack height={"100%"}>
      <Box textAlign="center">
        <PixelText>
          {itm.content}
        </PixelText>
      </Box>
      <Box height={"100%"}>
        <Stack height="100%" justifyContent="center">
          <SettingsRemoteIcon />
        </Stack>
      </Box>
    </Stack>
  );

  const PositionItem: React.FC<{ itm: TimelineItem }> = ({ itm }) => (
    <Box height={"100%"}>
      <Box textAlign="center">
        <PixelText>
          {itm.content}
        </PixelText>
      </Box>
      <Stack spacing={0.5}>
        {itm.servos?.map((servo: ServoType, idx: number) => (
          <RetroProgressBar 
            key={"servo" + idx + itm.name} 
            color={servo.enabled ? "primary" : "inherit"} 
            variant="determinate" 
            value={((servo.value ?? 0) * 100) / 180} 
          />
        ))}
      </Stack>
    </Box>
  );

  /**
   * DRAG AND DROP EVENT HANDLER
   * 
   * Handles all drag-and-drop operations in the sequence editor:
   * 
   * 1. ADDING NEW ACTIONS (objects → timeline):
   *    - Copies timeline object to create new action
   *    - Inserts at the dropped position in sequence
   *    - Plays audio feedback for user confirmation
   *    - Assigns unique ID for React keys
   * 
   * 2. REORDERING ACTIONS (timeline → timeline):
   *    - Moves existing action to new position
   *    - Maintains all action properties and references
   *    - Plays different audio for move vs add operations
   * 
   * @param {DropResult} res - Drag result from react-beautiful-dnd
   */
  const onDragEnd = (res: DropResult) => {
    // Exit early if dropped outside valid drop zone
    if (!res.destination) {
      return;
    }
    
    if (res.source.droppableId === "objects" && res.destination.droppableId === "timeline") {
      /**
       * ADDING NEW ACTION FROM PALETTE
       * 
       * User dragged an item from the objects palette to the timeline.
       * Create a new action and insert it at the dropped position.
       */
      const objCpy = JSON.parse(JSON.stringify(timelineObjects![res.source.index]));
      safeSend("play", "timeline_add.mp3"); // Audio feedback for addition
      
      const actionsCopy = JSON.parse(JSON.stringify(sequence?.actions || [])) as Action[];
      const insert: Action = { 
        type: objCpy.type as Action["type"], 
        appId: objCpy.appId, 
        id: uuid() // Unique ID for React rendering
      } as Action;
      
      // Insert at the specified index
      actionsCopy.splice(res.destination.index, 0, insert);
      setSequence((old: SequenceType | null) => (old ? { ...old, actions: actionsCopy } : old));
      
    } else if (res.source.droppableId === "timeline" && res.destination.droppableId === "timeline") {
      /**
       * REORDERING EXISTING ACTIONS
       * 
       * User dragged an action from one timeline position to another.
       * Move the action while preserving all its properties.
       */
      safeSend("play", "timeline_move.mp3"); // Audio feedback for reordering
      
      const actionsCpy = JSON.parse(JSON.stringify(sequence?.actions || [])) as Action[];
      const cutAction = actionsCpy.splice(res.source.index, 1)[0]; // Remove from original position
      actionsCpy.splice(res.destination.index, 0, cutAction);       // Insert at new position
      
      setSequence((old: SequenceType | null) => (old ? { ...old, actions: actionsCpy } : old));
    }
  };

  /**
   * TIMELINE ITEM RENDERER
   * 
   * Factory function that creates the appropriate React component for each timeline item type.
   * Supports different visual representations for different action types.
   * 
   * @param {TimelineItem} itm - The timeline item to render
   * @returns {JSX.Element | null} Appropriate component or null for unknown types
   */
  const makeItem = (itm: TimelineItem) => {
    if (itm.type === "delay") return <DelayItem itm={itm} />;      // Fixed duration waits
    else if (itm.type === "move") return <PositionItem itm={itm} />; // Servo movements
    else if (itm.type === "wait") return <WaitItem itm={itm} />;     // Interactive waits
    return null; // Unknown type
  };

  const makeDefaultPosition = () => {
    return null;
  };

  const handlePositionModal = (type: "cancel" | "createPosition" | "updatePosition", data?: PositionType | undefined) => {
    if (type === "cancel") setPositionModal(defaultPositionModal);
    else if (type === "createPosition") {
      setPositionModal(defaultPositionModal);
      if (!data) return;
      createPosition(robotPath as string, data)
        .then((res: PositionType[]) => setPositions(res))
        .catch((err: unknown) => console.log(err));
    } else if (type === "updatePosition") {
      setPositionModal(defaultPositionModal);
      if (!data) return;
      updatePosition(robotPath as string, data)
        .then((res: PositionType[]) => setPositions(res))
        .catch((err: unknown) => console.log(err));
    }
  };

  const TimelineObjects: React.FC = () => {
    return (
      <SectionContainer>
        <Box sx={{ paddingLeft: "4px" }}>
          <RetroTitle variant="h6">ACTIONS</RetroTitle>
        </Box>
          <Droppable droppableId="objects" direction="horizontal" isDropDisabled={true}>
            {(provided) => (
              <Stack component={Paper} ref={provided.innerRef} {...provided.droppableProps} direction={"row"} p={1} width={"100%"} spacing={0.5} sx={droppableStyle}>
                {timelineObjects?.map((itm: TimelineItem, idx: number) => (
                  <Draggable key={"timelineitm" + itm.id} draggableId={itm.id} index={idx}>
                    {(provided, snapshot) => (
                      <>
                        <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} component={Paper} p={0.5}>
                          {makeItem(itm)}
                        </Box>
                        {snapshot.isDragging && (
                          <Box component={Paper} p={0.5}>
                            {makeItem(itm)}
                          </Box>
                        )}
                      </>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
      </SectionContainer>
    );
  };

  const Timeline: React.FC = () => {
    return (
      <SectionContainer>
        <Stack spacing={1}>
          <Box sx={{ paddingLeft: "4px" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <RetroTitle variant="h6">MY SEQUENCE</RetroTitle>
              {(sequence?.actions?.length || 0) > 0 ? (
                <DangerButton size="small" onClick={() => setShowClearTimelineConfirm(true)}>
                  Clear Timeline
                </DangerButton>
              ) : null}
            </Stack>
          </Box>
          <Droppable droppableId="timeline" direction="horizontal">
            {(provided) => (
              <Stack component={Paper} ref={provided.innerRef} {...provided.droppableProps} direction={"row"} p={1} width={"100%"} spacing={0.5} sx={droppableStyle}>
        {((sequence?.actions || []) as Action[]).map((a, idx: number) => {
          const found = a.appId ? timelineObjects?.find((obj: TimelineItem) => obj.appId === a.appId) ?? null : null;
          // If we couldn't find the referenced object, render a placeholder
          const itm = found
            ? (JSON.parse(JSON.stringify(found)) as TimelineItem)
            : { id: `missing-${a.appId ?? idx}`, content: "MISSING", type: "move", servos: [], appId: a.appId } as TimelineItem;
          itm.id = a.id ?? itm.id;
          return (
            <Draggable key={"timelineItm" + itm.id} draggableId={itm.id} index={idx}>
              {(provided2) => (
                <Box component={Paper} ref={provided2.innerRef} {...provided2.draggableProps} {...provided2.dragHandleProps} p={0.5}>
                  {makeItem(itm)}
                </Box>
              )}
            </Draggable>
          );
        })}
                {provided.placeholder}
              </Stack>
            )}
          </Droppable>
        </Stack>
      </SectionContainer>
    );
  };

  const isSavable = () => {
    if (sequence.name === "") return false;
    if (sequenceId !== "newsequenceplaceholder") {
      if (JSON.stringify(sequence) === JSON.stringify(ogSequense)) {
        return false;
      }
    }
    return true;
  };

  const handleSelectPosition = async (type: string, data?: PositionType) => {
    if (type === "cancel") setSelectPositionModal(defaultSelectPositionModal);
    else if (type === "edit") {
      setSelectPositionModal(defaultSelectPositionModal);
  setPositionModal({ show: true, mode: "edit", position: data ?? null });
    } else if (type === "delete") {
      setSelectPositionModal(defaultSelectPositionModal);
  setDeletePositionModal({ show: true, position: data ?? null });
    }
  };

  const handleConfirmDelete = async (type: string) => {
    if (type === "cancel") setDeletePositionModal(defaultDeletePositionModal);
    else if (type === "delete") {
      setDeletePositionModal(defaultDeletePositionModal);
      if (deletePositionModal.position) {
        deletePosition(robotPath as string, deletePositionModal.position)
          .then((res: PositionType[]) => setPositions(res))
          .catch((err: unknown) => console.error(err));
      }
    }
  };

  const makeActionsFromRefs = (): Action[] => {
    // Early return if timelineObjects isn't ready yet
    if (!timelineObjects || !sequence) return [];
    
    const out: Action[] = [];
    let lastType: string | null = null;

    for (const act of (sequence?.actions || []) as Action[]) {
      const theObjRaw = timelineObjects?.find((obj) => obj.appId === act.appId);
      if (!theObjRaw) {
        // This indicates the sequence references a position that no longer exists.
        // Log as debug instead of warning to reduce console noise, but keep the
        // defensive behavior to prevent crashes.
        console.debug("Sequence.makeActionsFromRefs: missing referenced position with appId", act.appId, "- this position may have been deleted");
        // reset lastType because we don't have a meaningful type to compare
        lastType = null;
        continue;
      }

      const theObj = JSON.parse(JSON.stringify(theObjRaw)) as TimelineItem;

      // id and appId are optional on TimelineItem so delete is allowed
      delete (theObj as any).id;
      delete (theObj as any).appId;

      if (theObj.type === "move" && lastType === "move") {
        const previouState = out.pop() as any;
        previouState.content = (previouState.content || "") + "/" + (theObj.content || "");
        (theObj.servos || []).forEach((servo: ServoType, idx: number) => {
          if (servo.enabled) previouState.servos[idx] = servo;
        });
        out.push(previouState as Action);
      } else {
        out.push(theObj as Action);
      }

      lastType = theObj.type ?? null;
    }
    return out;
  };

  const handleConfirmDeleteSequence = (data: string) => {
    if (data === "cancel") {
      setConfirmDeleteSequenceModal(defaultConfirmDeleteSequenceModal);
    } else if (data === "delete") sequenceDelete();
  };

  const handleClearTimelineConfirm = () => {
    setSequence((old) => (old ? { ...old, actions: [] } : old));
    setShowClearTimelineConfirm(false);
  };

  const handleClearTimelineCancel = () => {
    setShowClearTimelineConfirm(false);
  };

  const Modals = () => (
    <>
      {positionModal.mode !== null ? <EditPositionModal mode={positionModal.mode} position={positionModal.position} out={handlePositionModal} /> : null}
      {selectPositionModal.show ? <SelectPositionModal positions={modalPositions || []} out={handleSelectPosition} /> : null}
      {deletePositionModal.show ? <ConfirmDeletePositionModal position={deletePositionModal.position} out={handleConfirmDelete} /> : null}
      {confirmDeleteSequenceModal.show ? <ConfirmDeleteSequenceModal name={confirmDeleteSequenceModal.name} out={handleConfirmDeleteSequence} /> : null}
      <RetroConfirmModal
        open={showClearTimelineConfirm}
        title="Clear Timeline"
        message="Are you sure you want to clear the timeline? This will remove all actions from your sequence."
        confirmText="Clear"
        cancelText="Cancel"
        onConfirm={handleClearTimelineConfirm}
        onCancel={handleClearTimelineCancel}
        danger={true}
      />
    </>
  );

  const TypeSelector = () => (
    <SectionContainer>
      <Stack direction="row-reverse">
        <Box width="40px" />
        <Box component={Paper}>
          <Stack direction="row" p={1} spacing={1}>
            <RetroButton variant="contained">Wait</RetroButton>
            <RetroButton variant="contained">Move</RetroButton>
          </Stack>
        </Box>
      </Stack>
    </SectionContainer>
  );

  return (
    <Stack height={"100%"} width={"100%"} maxWidth={"100vw"} sx={{ overflow: "hidden" }}>
      <HeaderBar>
        <Stack direction="row" width={"100%"} spacing={1} alignItems="center">
          <RetroTextField 
            fullWidth
            label="Sequence Name" 
            error={sequence.name === ""} 
            size="small" 
            variant="outlined"
            value={sequence.name} 
            onChange={(e) => setSequence((old: any) => ({ ...old, name: e.target.value }))} 
          />
        <Box>
          <Tooltip title="New Position">
            <IconButton color="inherit" size="small" onClick={() => setPositionModal({ show: true, mode: "new", position: makeDefaultPosition() })}>
              <ControlPointDuplicateIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Edit Position">
            <IconButton size="small" color="inherit" onClick={() => { setModalPositions(positions); setSelectPositionModal({ show: true }); }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ justifyContent: "center" }}>
          <IconButton color="info" disabled={!isSavable()} size="small" onClick={sequenceSave}>
            <Tooltip title="Save Sequence">
              <SaveIcon />
            </Tooltip>
          </IconButton>
        </Box>
        {sequenceId !== "newsequenceplaceholder" ? (
          <Box>
              <Tooltip title="Delete Sequence">
              <IconButton size="small" color="error" onClick={() => setConfirmDeleteSequenceModal({ show: true, name: sequence?.name ?? "" })}>
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : null}

          <Tooltip title="Return to robot">
            <IconButton color="inherit" sx={{ whiteSpace: "nowrap" }} size="small" onClick={() => navigate("/robot/" + robotPath)}>
              <KeyboardReturnIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </HeaderBar>
      <Divider />
      <Box height={"100%"} p={1}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Stack height={"100%"} justifyContent={"space-around"}>
            <TypeSelector />
            <TimelineObjects />
            <Timeline />
          </Stack>
        </DragDropContext>
      </Box>
      <Transport actions={makeActionsFromRefs()} />
      <Modals />
    </Stack>
  );
};
