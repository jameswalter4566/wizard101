import React, { useEffect, useCallback, useRef } from 'react';

interface GameControlsProps {
  wizardPosition: number[];
  setWizardPosition: (pos: number[]) => void;
  wizardRotation: number;
  setWizardRotation: (rot: number) => void;
  setIsMoving?: (moving: boolean) => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  wizardPosition,
  setWizardPosition,
  wizardRotation,
  setWizardRotation,
  setIsMoving,
}) => {
  const moveSpeed = 0.15; // Increased for more responsiveness
  const rotationSpeed = 0.08; // Increased for faster turning
  const keysPressed = useRef(new Set<string>());

  const moveWizard = useCallback(() => {
    const keys = keysPressed.current;
    if (keys.size === 0) return;

    const [x, y, z] = wizardPosition;
    let newX = x;
    let newZ = z;
    let newRotation = wizardRotation;
    let moved = false;
    
    // Movement accumulation variables
    let moveForward = 0;
    let moveSide = 0;

    // Handle rotation - A and D only rotate now
    if (keys.has('a') && !keys.has('d')) {
      newRotation += rotationSpeed;
    } else if (keys.has('d') && !keys.has('a')) {
      newRotation -= rotationSpeed;
    }

    // Handle rotation with arrow keys
    if (keys.has('arrowleft') && !keys.has('arrowright')) {
      newRotation -= rotationSpeed;
    } else if (keys.has('arrowright') && !keys.has('arrowleft')) {
      newRotation += rotationSpeed;
    }

    // Handle forward/backward movement - allow both W and S to cancel each other
    if (keys.has('w') || keys.has('arrowup')) {
      moveForward += 1;
    }
    if (keys.has('s') || keys.has('arrowdown')) {
      moveForward -= 1;
    }

    // Handle strafe movement with Q and E
    if (keys.has('q')) {
      moveSide -= 1; // Strafe left
    }
    if (keys.has('e')) {
      moveSide += 1; // Strafe right
    }

    // Apply forward/backward movement
    if (moveForward !== 0) {
      const actualMoveSpeed = moveSpeed * moveForward;
      newX += Math.sin(newRotation) * actualMoveSpeed;
      newZ += Math.cos(newRotation) * actualMoveSpeed;
      moved = true;
    }

    // Apply strafe movement (perpendicular to forward direction)
    if (moveSide !== 0) {
      const actualStrafeSpeed = moveSpeed * moveSide;
      // Strafe is 90 degrees to the right of forward direction
      newX += Math.sin(newRotation + Math.PI / 2) * actualStrafeSpeed;
      newZ += Math.cos(newRotation + Math.PI / 2) * actualStrafeSpeed;
      moved = true;
    }

    // Update position if moved
    if (moved) {
      setWizardPosition([newX, y, newZ]);
    }
    
    // Update rotation if changed
    if (newRotation !== wizardRotation) {
      setWizardRotation(newRotation);
    }
    
    // Update movement state based on whether we're actually moving
    if (setIsMoving) {
      // Only set to true if we're actively moving (not just rotating)
      const actuallyMoving = moved;
      setIsMoving(actuallyMoving);
      
      // Debug logging
      if (Math.random() < 0.05) { // Log occasionally
        console.log('[GameControls] Movement state:', {
          keys: Array.from(keys),
          moveForward,
          moveSide,
          moved,
          actuallyMoving,
          position: [newX.toFixed(2), y.toFixed(2), newZ.toFixed(2)]
        });
      }
    }
  }, [wizardPosition, wizardRotation, setWizardPosition, setWizardRotation, setIsMoving, moveSpeed, rotationSpeed]);

  useEffect(() => {
    let animationFrame: number;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't process game controls if an input is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      
      const key = event.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        event.preventDefault();
        keysPressed.current.add(key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysPressed.current.delete(key);
      
      // If no keys are pressed, ensure we stop moving
      if (keysPressed.current.size === 0 && setIsMoving) {
        setIsMoving(false);
      }
    };

    const gameLoop = () => {
      moveWizard();
      animationFrame = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    gameLoop();

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrame);
      keysPressed.current.clear();
    };
  }, [moveWizard]);

  // Handle focus loss (tab away) - stop all movement
  useEffect(() => {
    const handleBlur = () => {
      keysPressed.current.clear();
      if (setIsMoving) {
        setIsMoving(false);
      }
    };

    const handleFocus = () => {
      keysPressed.current.clear();
      if (setIsMoving) {
        setIsMoving(false);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [setIsMoving]);

  return null;
};

export default GameControls;