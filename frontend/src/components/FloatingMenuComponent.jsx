// src/components/FloatingMenu.jsx
import React, { useState } from "react";
import {
  FloatingMenu,
  MainButton,
  ChildButton,
} from "react-floating-button-menu";
import { FaPlus, FaPen, FaBook, FaRobot } from "react-icons/fa";
import "react-floating-button-menu/dist/index.css";
import "./FloatingMenuComponent.css"; // Vezi mai jos CSS

const FloatingMenuComponent = ({ onOpenNotebook, onOpenDictionary, onOpenChatBot }) => {
  const [isOpen, setIsOpen] = useState(false);
 return (
    <div className="floating-menu-wrapper">
      <FloatingMenu
        slideSpeed={500}
        direction="up"
        spacing={8}
        isOpen={isOpen}
      >
        <MainButton
          iconResting={<FaPlus style={{ fontSize: 20 }} />}
          iconActive={<FaPlus style={{ fontSize: 20, transform: "rotate(45deg)" }} />}
          backgroundColor="#c4a484"
          onClick={() => setIsOpen(!isOpen)}
          size={56}
        />
        <ChildButton
          icon={<FaPen />}
          backgroundColor="#c4a484"
          size={48}
          onClick={onOpenNotebook}
          tooltip="Notițe"
        />
        <ChildButton
          icon={<FaBook />}
          backgroundColor="#c4a484"
          size={48}
          onClick={onOpenDictionary} // ✅ Asta e corect acum
          tooltip="Dicționar"
        />
         <ChildButton
    icon={<FaRobot />}
    backgroundColor="#c4a484"
    size={48}
    onClick={onOpenChatBot} // ← aici
    tooltip="AI Asistent"
  />
      </FloatingMenu>
    </div>
  );
};

export default FloatingMenuComponent;
