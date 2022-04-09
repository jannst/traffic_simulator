import styled from "styled-components";
import {
    background,
    BackgroundProps,
    border, BorderProps,
    flexbox, FlexboxProps,
    layout,
    LayoutProps,
    shadow, ShadowProps,
    space,
    SpaceProps, typography, TypographyProps
} from 'styled-system'

export interface BoxProps extends SpaceProps, LayoutProps, BackgroundProps, BorderProps, ShadowProps, TypographyProps, FlexboxProps {
}

export const Box = styled.div<BoxProps>`
  display: block;
  ${space};
  ${layout};
  ${background};
  ${border};
  ${shadow};
  ${typography}
  ${flexbox}
`

export interface FlexProps extends SpaceProps, LayoutProps, BackgroundProps, BorderProps, ShadowProps, FlexboxProps, TypographyProps {
}

export const Flex = styled.div<FlexProps>`
  display: flex;
  ${flexbox};
  ${space};
  ${layout};
  ${background};
  ${border};
  ${typography}
  ${shadow};
`;