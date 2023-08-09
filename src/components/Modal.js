import React from "react";
import styled from "styled-components";
import useStore from '../store/store';

const Scrim = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`
function Modal() {
  const {
    modalOpen,
    closeModal,
    modalContent,
  } = useStore();

  if (modalOpen) {
    return (
      <Scrim onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal();
        }}}>
        {modalContent}
      </Scrim>
    )
  }
}

export default Modal;