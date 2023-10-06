import React, { useEffect, useRef, useState } from "react";
import { useAnimation, motion } from "framer-motion";

export const keyFor = (log: any, index: number) => {
  return log.id + "*" + index;
};

const TextRenderer: React.FC<{
  log: any;
  keyToSectionMap: Map<string, number>;
  keyToIndexInSectionMap: Map<string, number>;
  indexFromEnd: number;
  nSections: number;
}> = ({
  log,
  indexFromEnd,
  keyToSectionMap,
  keyToIndexInSectionMap,
  nSections,
}) => {
  const text = log.message.chunk as string;
  return (
    <>
      {text.split(/[\n]/).map((item, index, array) => {
        const sectionIndex = keyToSectionMap.get(keyFor(log, index)) as number;
        const indexInSection = keyToIndexInSectionMap.get(
          keyFor(log, index)
        ) as number;
        return (
          <React.Fragment key={index}>
            <Chunk
              sectionIndex={sectionIndex}
              text={item}
              indexInSection={indexInSection}
              indexFromEnd={indexFromEnd}
              nSections={nSections}
            />
            {index < array.length - 1 && <div style={{ width: "100%" }} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const MAX_LINE_HEIGHT = "26px";
const Chunk: React.FC<{
  text: string;
  indexFromEnd: number;
  indexInSection: number;
  sectionIndex: number;
  nSections: number;
}> = ({ text, indexFromEnd, indexInSection, sectionIndex, nSections }) => {
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [finishedAppearing, setFinishedAppearing] = useState(false);

  useEffect(() => {
    if (!finishedAppearing) {
      controls
        .start({
          opacity: 1,
          transition: {
            opacity: {
              duration: 0.4,
            },
          },
        })
        .then(() => {
          setFinishedAppearing(true);
        });
    }
    controls.start({
      x: 0,
      y: 0,
      maxHeight: MAX_LINE_HEIGHT,
      transition: {
        x: { duration: 0.2 },
        y: { duration: 0.2 },
        maxHeight: { duration: 0.4 },
      },
    });
  }, [controls, finishedAppearing]);

  useEffect(() => {
    if (sectionIndex === nSections - 2) {
      const handle = setTimeout(() => {
        if (sectionIndex === nSections - 2 && indexInSection === 0) {
          if (ref.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
        controls.start({
          opacity: 1,
          transition: {
            opacity: {
              duration: 0.3,
            },
          },
        });
      }, 600);
      return () => {
        clearTimeout(handle);
      };
    }
    if (sectionIndex < nSections - 2) {
      const handle = setTimeout(() => {
        controls.start({
          opacity: 0.3,
          transition: {
            opacity: {
              duration: 0.3,
            },
          },
        });
      }, 600);
      return () => {
        clearTimeout(handle);
      };
    }
  }, [controls, nSections, indexInSection, sectionIndex]);

  return (
    <motion.span
      ref={ref}
      style={{
        marginTop: "2px",
        marginBottom: "2px",
        fontSize: "22px",
        whiteSpace: "pre-wrap",
        overflowY: "visible",
        color: "black",
        transition: "color 0.3s ease",
      }}
      initial={{
        opacity: 0,
        x: 2,
        y: 0,
        minHeight: 0,
      }}
      animate={controls}
    >
      {text}
    </motion.span>
  );
};

export default TextRenderer;
