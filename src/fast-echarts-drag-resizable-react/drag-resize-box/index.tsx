import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type {
  Direction,
  DragResizableBoxProps,
  CollectedRectType,
  AllBoxRectCollectorType,
  LimitType,
} from './types';
import './index.less';

const directionArr = [
  'left_top',
  'left_bottom',
  'right_top',
  'right_bottom',
  'top',
  'bottom',
  'left',
  'right',
];

const initCollector = {
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  right: 0,
  bottom: 0,
  pointX: 0,
  pointY: 0,
  shiftX: 0,
  shiftY: 0,
};

/**
 * 获取当前方位坐标
 * @param el
 * @returns
 */
const getCoords = (el: Element) => {
  const rect = el.getBoundingClientRect();
  let left = window.pageXOffset + rect.left;
  let right = window.pageXOffset + rect.right;
  let top = window.pageYOffset + rect.top;
  let bottom = window.pageYOffset + rect.bottom;
  return {
    left,
    right,
    top,
    bottom,
  };
};

const DragResizeBox: React.FC<DragResizableBoxProps> = React.memo((props) => {
  const {
    children,
    rect,
    className,
    style,
    relative,
    minWidth = 20,
    minHeight = 20,
    guides = true,
    adsorb = true,
    diff = 3,
    onChange,
    limit,
    guidesColor = 'rgb(0, 120, 212)',
  } = props;

  const box = useRef<HTMLDivElement | null>(null);
  // 用来记录鼠标点下去时元素的属性值
  const collector = useRef(initCollector);
  const allBoxRectCollector = useRef<AllBoxRectCollectorType[]>([]);
  // 方向
  const direction = useRef<Direction>('left');
  // 辅助线
  const line_n = useRef<HTMLDivElement>(null);
  const line_e = useRef<HTMLDivElement>(null);
  const line_s = useRef<HTMLDivElement>(null);
  const line_w = useRef<HTMLDivElement>(null);
  const line_mdx = useRef<HTMLDivElement>(null);
  const line_mdy = useRef<HTMLDivElement>(null);

  const [allowResize, setAllowResize] = useState(false);
  const [rectAttr, setRectAttr] = useState<CollectedRectType>({} as CollectedRectType);

  const onMouseUp = useCallback(() => {
    hiddenLine();
    document.removeEventListener('mousemove', onMouseMove);
  }, []);

  const onCancelChecked = useCallback((e: MouseEvent) => {
    const isChild = box.current!.contains(e.target as Node);
    if (!isChild) {
      setAllowResize(false);
    }
  }, []);
  const onChecked = useCallback(() => setAllowResize(true), []);
  /**
   * 判断是否接近
   */
  const isNearly = useCallback(
    (value1: number, value2: number) => {
      return Math.abs(value1 - value2) <= diff;
    },
    [diff],
  );
  const showLine = useCallback((whichLine: React.RefObject<HTMLDivElement>) => {
    whichLine.current!.hidden = false;
  }, []);

  const hiddenLine = useCallback(() => {
    [line_n, line_e, line_s, line_w, line_mdx, line_mdy].forEach((line) => {
      line.current!.hidden = true;
    });
  }, []);

  const handleLines = useCallback(
    (curCalcRect: CollectedRectType) => {
      allBoxRectCollector.current.forEach((elementRect) => {
        const { top, left, width, height, bottom, right } = elementRect;
        const halfX = top + height / 2;
        const halfY = left + width / 2;
        const conditions = {
          top: [
            {
              isNearly: isNearly(top, curCalcRect.top),
              lineNode: line_n.current,
              showLine: () => showLine(line_n),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top,
                height: 2,
              },
              adsorbNum: top,
            },
            {
              isNearly: isNearly(bottom, curCalcRect.top),
              lineNode: line_s.current,
              showLine: () => showLine(line_s),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: bottom,
                height: 2,
              },
              adsorbNum: bottom,
            },
            {
              isNearly: isNearly(bottom, curCalcRect.top + curCalcRect.height),
              lineNode: line_s.current,
              showLine: () => showLine(line_s),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: bottom,
                height: 2,
              },
              adsorbNum: bottom - curCalcRect.height,
            },
            {
              isNearly: isNearly(top, curCalcRect.top + curCalcRect.height),
              lineNode: line_s.current,
              showLine: () => showLine(line_s),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: top,
                height: 2,
              },
              adsorbNum: top - curCalcRect.height,
            },
            //我的中间跟别人的中间：x轴
            {
              isNearly: isNearly(halfX, curCalcRect.top + curCalcRect.height / 2),
              lineNode: line_mdx.current,
              showLine: () => showLine(line_mdx),
              lineStyle: {
                width:
                  curCalcRect.left > left
                    ? curCalcRect.left + curCalcRect.width - left
                    : right - curCalcRect.left,
                left: curCalcRect.left > left ? left : curCalcRect.left,
                top: halfX,
                height: 2,
              },
              adsorbNum: halfX - curCalcRect.height / 2,
            },
          ],
          left: [
            //我的左边跟别人的左边
            {
              isNearly: isNearly(left, curCalcRect.left),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: left,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: left,
            },
            {
              isNearly: isNearly(left, curCalcRect.left + curCalcRect.width),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: left,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: left - curCalcRect.width,
            },
            //我的右边跟别人的右边
            {
              isNearly: isNearly(right, curCalcRect.left + curCalcRect.width),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: right,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: right - curCalcRect.width,
            },
            //我的左边跟别人的右边
            {
              isNearly: isNearly(right, curCalcRect.left),
              lineNode: line_w.current,
              showLine: () => showLine(line_w),
              lineStyle: {
                width: 2,
                left: right,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: right,
            },
            //我的 中间跟别人的中间：y 轴
            {
              isNearly: isNearly(halfY, curCalcRect.left + curCalcRect.width / 2),
              lineNode: line_mdy.current,
              showLine: () => showLine(line_mdy),
              lineStyle: {
                width: 2,
                left: halfY,
                top: curCalcRect.top > top ? top : curCalcRect.top,
                height:
                  curCalcRect.top > top
                    ? Math.abs(curCalcRect.top - top + collector.current.height)
                    : Math.abs(bottom - curCalcRect.top),
              },
              adsorbNum: halfY - curCalcRect.width / 2,
            },
          ],
        };

        (Object.keys(conditions) as Array<keyof typeof conditions>).forEach((key) => {
          conditions[key].forEach(({ isNearly, lineStyle, lineNode, adsorbNum, showLine }) => {
            if (isNearly) {
              showLine();
              (Object.keys(lineStyle) as Array<keyof typeof lineStyle>).forEach(
                (key) => (lineNode!.style[key] = lineStyle[key] + 'px'),
              );
              // 允许磁吸效果
              if (adsorb) {
                curCalcRect[key] = adsorbNum;
              }
            }
          });
        });
      });
    },
    [adsorb],
  );
  /**
   * 计算移动后点位数据
   */
  const handleCalcRect = useCallback(
    (
      collectorRect: CollectedRectType,
      offsetInfo: {
        offsetX: number;
        offsetY: number;
        shiftX: number;
        shiftY: number;
      },
      e: MouseEvent,
    ): CollectedRectType => {
      let { left, top, width, height } = collectorRect;
      let { offsetX, offsetY, shiftX, shiftY } = offsetInfo;
      switch (direction.current) {
        case 'left_top':
          left = Math.min(left + width - minWidth, left - offsetX);
          top = Math.min(top + height - minHeight, top - offsetY);
          width = width + offsetX;
          height = height + offsetY;
          break;
        case 'left_bottom':
          left = Math.min(left + width - minWidth, left - offsetX);
          width = width + offsetX;
          height = height - offsetY;
          break;
        case 'right_top':
          top = Math.min(top + height - minHeight, top - offsetY);
          width = width - offsetX;
          height = height + offsetY;
          break;
        case 'right_bottom':
          width = width - offsetX;
          height = height - offsetY;
          break;
        case 'top':
          top = Math.min(top + height - minHeight, top - offsetY);
          height = height + offsetY;
          break;
        case 'bottom':
          height = height - offsetY;
          break;
        case 'left':
          left = Math.min(left + width - minWidth, left - offsetX);
          width = width + offsetX;
          break;
        case 'right':
          width = width - offsetX;
          break;
        case 'content':
          left = e.pageX - shiftX;
          top = e.pageY - shiftY;
          break;
      }
      return { width, height, left, top };
    },
    [],
  );

  /**
   * 收集所有相同移动盒子的 rect 属性
   */
  const collectAllBoxRect = useCallback(() => {
    allBoxRectCollector.current = [];
    //其他所有相同的移动盒子
    let allBoxes = Array.from(
      (relative ? box.current?.parentElement! : document).querySelectorAll('.dragResizeBox'),
    ) as HTMLElement[];
    
    for (let boxItem of allBoxes) {
      if (boxItem === box.current) {
        continue;
      }
      let { width, height } = boxItem.getBoundingClientRect();
      let position: LimitType = {} as LimitType;
      if (relative) {
        Object.assign(position, {
          left: boxItem.offsetLeft,
          top: boxItem.offsetTop,
          bottom: boxItem.offsetTop + height,
          right: boxItem.offsetLeft + width,
        });
      } else {
        position = getCoords(boxItem);
      }

      allBoxRectCollector.current.push({
        width,
        height,
        ...position,
      });
    }
  }, [relative]);

  const handleLimit = useCallback(
    (rect: CollectedRectType, limit: LimitType): CollectedRectType => {
      let { left, top, width, height } = rect;
      switch (direction.current) {
        case 'content':
          if (left < limit.left) {
            left = limit.left;
          }
          if (left > limit.right - width) {
            left = limit.right - width;
          }
          if (top < limit.top) {
            top = limit.top;
          }
          if (top > limit.bottom - height) {
            top = limit.bottom - height;
          }
          break;
        case 'left_top':
          if (top < limit.top) {
            top = limit.top;
          }
          if (left < limit.left) {
            left = limit.left;
          }
          break;
        case 'top':
          if (top < limit.top) {
            top = limit.top;
          }
          break;
        case 'right_top':
          if (top < limit.top) {
            top = limit.top;
          }
          if (width + left > limit.right) {
            left = Math.max(limit.left, left - (width + left - limit.right));
          }
          break;
        case 'right':
          if (left + width > limit.right) {
            left = Math.max(limit.left, left - (left + width - limit.right));
          }
          break;
        case 'right_bottom':
          if (left + width > limit.right) {
            left = Math.max(limit.left, left - (left + width - limit.right));
          }
          if (top + height > limit.bottom) {
            top = Math.max(limit.top, top - (top + height - limit.bottom));
          }
          break;
        case 'bottom':
          if (top + height > limit.bottom) {
            top = Math.max(limit.top, top - (top + height - limit.bottom));
          }
          break;
        case 'left_bottom':
          if (left < limit.left) {
            left = limit.left;
          }
          if (top + height > limit.bottom) {
            top = Math.max(limit.top, top - (top + height - limit.bottom));
          }
          break;
        case 'left':
          if (left < limit.left) {
            left = limit.left;
          }
          break;
      }
      if (width > limit.right - limit.left) {
        width = limit.right - limit.left;
      }
      if (height > limit.bottom - limit.top) {
        height = limit.bottom - limit.top;
      }
      return { width, height, left, top };
    },
    [],
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      let { left, top, width, height, pointX, pointY, shiftX, shiftY } = collector.current;
      let offsetX = pointX - e.pageX;
      let offsetY = pointY - e.pageY;

      let curCalcRect = handleCalcRect(
        { left, top, width, height },
        { offsetX, offsetY, shiftX, shiftY },
        e,
      );
      // 移动时处理辅助线
      if (direction.current === 'content' && guides) {
        hiddenLine();
        handleLines(curCalcRect);
      }

      if (limit) {
        curCalcRect = handleLimit(curCalcRect, limit);
      }
      onChange
        ? onChange({
            ...curCalcRect,
            width: Math.max(minWidth, curCalcRect.width),
            height: Math.max(minHeight, curCalcRect.height),
          })
        : setRectAttr({
            ...curCalcRect,
            width: Math.max(minWidth, curCalcRect.width),
            height: Math.max(minHeight, curCalcRect.height),
          });
    },
    [guides],
  );

  const onMouseDown = useCallback((e:React.MouseEvent<HTMLSpanElement, MouseEvent>, currentDirection: Direction) => {
    e.stopPropagation();
    
    collectAllBoxRect();
    //只有左键才有效
    if (e.button !== 0) return;
    // 获取元素在盒子中的rect属性
    let left, top, right, bottom;
    if (relative) {
      left = box.current?.offsetLeft!;
      top = box.current?.offsetTop!;
    } else {
      left = getCoords(box.current!).left;
      top = getCoords(box.current!).top;
    }
    right = left + box.current?.offsetWidth!;
    bottom = top + box.current?.offsetHeight!;

    // 获取元素矩阵大小
    let { width, height } = box.current?.getBoundingClientRect()!;
    // 存下鼠标点击后的鼠标坐标
    let pointX = e.pageX,
      pointY = e.pageY;
    let shiftX = pointX - left,
      shiftY = pointY - top;

    // 将所有属性都记录下来
    Object.assign(collector.current, {
      left,
      top,
      width,
      height,
      pointX,
      pointY,
      shiftX,
      shiftY,
      right,
      bottom,
    });

    direction.current = currentDirection;
    document.addEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('click', onCancelChecked);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('click', onCancelChecked);
    };
  }, []);

  return (
    <>
      <div
        ref={box}
        style={{ ...style, ...rect, ...rectAttr }}
        className={`dragResizeBox ${allowResize ? 'checked':''} ${className}`}
        onClick={onChecked}
      >
        {directionArr.map((item) => (
          <span
            key={item}
            className={allowResize ? `rect rect_${item}` : ''}
            onMouseDown={(e) => onMouseDown(e, item as Direction)}
          ></span>
        ))}
        <div className={'content'} onMouseDown={(e) => onMouseDown(e, 'content')}>
          {children}
        </div>
      </div>
      {[
        { className: 'n', ref: line_n },
        { className: 'e', ref: line_e },
        { className: 's', ref: line_s },
        { className: 'w', ref: line_w },
        { className: 'mdx', ref: line_mdx },
        { className: 'mdy', ref: line_mdy },
      ].map(({ className, ref }) => (
        <div
          key={className}
          style={{ backgroundColor: guidesColor }}
          className={`line line_${className}`}
          ref={ref}
        ></div>
      ))}
    </>
  );
});

export default DragResizeBox;
