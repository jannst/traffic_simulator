import styled from "styled-components";
import {background, BackgroundProps} from "styled-system";
import {Box} from "./Layout";

export const Text = styled.p`
  font-size: 12px;
  padding: 0;
  margin: 0;
`

export const SubText = styled(Text)`
  font-size: 9px;
`

export const Button = styled.button<BackgroundProps>`
  ${background};
`;

export const Heading = styled.h3`
  text-align: center;
  color: white;
  margin: 3px;
`;

export const Container = styled(Box)`
  ::-webkit-scrollbar {
    width: 9px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgb(155, 155, 155);
    border-radius: 20px;
    border: transparent;
  }
`;

export const Operation = styled(Box)`
  font-size: 16px;
  text-align: center;
  padding: 3px;
  margin: 2px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  border: #282c34 solid;
  :hover .tooltiptext {
    visibility: visible;
  }
`;