// @/core/deck/Paths.ts

import TreeModel from 'tree-model';

interface PathNodeData {
    path: string[];
    originalIndex: number;
}

export class Paths {


    // 将paths数组转换为tree-model树结构
    private static buildTree(paths: string[][]): TreeModel.Node<PathNodeData> {
        const tree = new TreeModel();
        const root = tree.parse({ path: [], originalIndex: -1, children: [] });
        const nodeMap = new Map<string, TreeModel.Node<PathNodeData>>();
        paths.forEach((path, index) => {
            if (path.length === 0) {
                return;
            }
            let currentNode = root;
            for (let i = 0; i < path.length; i++) {
                const currentPath = path.slice(0, i + 1);
                const currentPathKey = JSON.stringify(currentPath);
                let childNode = nodeMap.get(currentPathKey);
                if (!childNode) {
                    childNode = tree.parse({
                        path: currentPath,
                        originalIndex: index,
                        children: [],
                    });
                    currentNode.addChild(childNode);
                    nodeMap.set(currentPathKey, childNode);
                } else {
                    childNode.model.originalIndex = Math.min(childNode.model.originalIndex, index);
                }
                currentNode = childNode;
            }
        });
        return root;
    }



    // 在树中找到指定路径的节点
    private static findNode(root: TreeModel.Node<PathNodeData>, targetPath: string[]): TreeModel.Node<PathNodeData> | null {
        const pathKey = JSON.stringify(targetPath);
        return root.first((node) => {
            return JSON.stringify(node.model.path) === pathKey;
        }) || null;
    }


    // 打印树结构（用于调试）
    private static printTree(node: TreeModel.Node<PathNodeData>, indent: string = ''): void {
        if (node.model.path.length > 0) {
            console.log(`${indent}${JSON.stringify(node.model.path)} (index: ${node.model.originalIndex})`);
        } else {
            console.log(`${indent}[root]`);
        }
        const children = [...node.children].sort((a: TreeModel.Node<PathNodeData>, b: TreeModel.Node<PathNodeData>) => a.model.originalIndex - b.model.originalIndex);
        children.forEach((child) => {
            Paths.printTree(child, indent + '  ');
        });
    }


    // 上移path，在同一层级内调整paths数组中的顺序
    static moveUp(paths: string[][], path: string[]): string[][] {
        console.log(`=== moveUp 要移动的path: ${JSON.stringify(path)} ===`);
        const root = Paths.buildTree(paths);
        console.log('=== moveUp 移动前 ===');
        Paths.printTree(root);
        const node = Paths.findNode(root, path);
        if (!node || !node.parent) {
            return paths;
        }
        const parent = node.parent;
        const siblings = [...parent.children];
        siblings.sort((a: TreeModel.Node<PathNodeData>, b: TreeModel.Node<PathNodeData>) => a.model.originalIndex - b.model.originalIndex);
        const currentIndex = siblings.indexOf(node);
        if (currentIndex === -1 || currentIndex === 0) {
            return paths;
        }
        const prevNode = siblings[currentIndex - 1];
        // 找到这两个path在paths数组中的位置并交换
        const pathKey = JSON.stringify(path);
        const prevPathKey = JSON.stringify(prevNode.model.path);
        const updatedPaths = [...paths];
        const pathIndex = updatedPaths.findIndex(p => JSON.stringify(p) === pathKey);
        const prevPathIndex = updatedPaths.findIndex(p => JSON.stringify(p) === prevPathKey);
        if (pathIndex !== -1 && prevPathIndex !== -1) {
            [updatedPaths[pathIndex], updatedPaths[prevPathIndex]] = [updatedPaths[prevPathIndex], updatedPaths[pathIndex]];
        }
        const newRoot = Paths.buildTree(updatedPaths);
        console.log('=== moveUp 移动后 ===');
        Paths.printTree(newRoot);
        return updatedPaths;
    }


    // 下移path，在同一层级内调整paths数组中的顺序
    static moveDown(paths: string[][], path: string[]): string[][] {
        console.log(`=== moveDown 要移动的path: ${JSON.stringify(path)} ===`);
        const root = Paths.buildTree(paths);
        console.log('=== moveDown 移动前 ===');
        Paths.printTree(root);
        const node = Paths.findNode(root, path);
        if (!node || !node.parent) {
            return paths;
        }
        const parent = node.parent;
        const siblings = [...parent.children];
        siblings.sort((a: TreeModel.Node<PathNodeData>, b: TreeModel.Node<PathNodeData>) => a.model.originalIndex - b.model.originalIndex);
        const currentIndex = siblings.indexOf(node);
        if (currentIndex === -1 || currentIndex === siblings.length - 1) {
            return paths;
        }
        const nextNode = siblings[currentIndex + 1];
        // 找到这两个path在paths数组中的位置并交换
        const pathKey = JSON.stringify(path);
        const nextPathKey = JSON.stringify(nextNode.model.path);
        const updatedPaths = [...paths];
        const pathIndex = updatedPaths.findIndex(p => JSON.stringify(p) === pathKey);
        const nextPathIndex = updatedPaths.findIndex(p => JSON.stringify(p) === nextPathKey);
        if (pathIndex !== -1 && nextPathIndex !== -1) {
            [updatedPaths[pathIndex], updatedPaths[nextPathIndex]] = [updatedPaths[nextPathIndex], updatedPaths[pathIndex]];
        }
        const newRoot = Paths.buildTree(updatedPaths);
        console.log('=== moveDown 移动后 ===');
        Paths.printTree(newRoot);
        return updatedPaths;
    }


    // 左移path，移除第一个路径段，让子文件夹从父目录中独立出来
    // 如果path有子路径，所有子路径也会左移，保持相对关系不变
    // 如果左移后的路径已存在，则抛出错误
    // 注意：左移不能让路径变成空数组（级别不能变成0）
    static moveLeft(paths: string[][], path: string[]): { updatedPaths: string[][], newPath: string[], childPathMap: Map<string, string[]> } {
        if (path.length <= 1) {
            return { updatedPaths: paths, newPath: path, childPathMap: new Map() };
        }
        console.log(`=== moveLeft 要移动的path: ${JSON.stringify(path)} ===`);
        const rootBefore = Paths.buildTree(paths);
        console.log('=== moveLeft 移动前 ===');
        Paths.printTree(rootBefore);
        const pathKey = JSON.stringify(path);
        const newPath = path.slice(1);
        const newPathKey = JSON.stringify(newPath);
        const childPathMap = new Map<string, string[]>();
        
        // 检查左移后的路径是否已存在，如果存在则抛出错误
        const existingNewPath = paths.find(p => JSON.stringify(p) === newPathKey);
        if (existingNewPath) {
            throw new Error(`Cannot move left: path ${JSON.stringify(newPath)} already exists`);
        }
        
        // 处理所有路径：左移目标路径及其子路径
        const updatedPaths = paths.map(p => {
            const pKey = JSON.stringify(p);
            // 如果是目标路径本身
            if (pKey === pathKey) {
                // 左移（newPath.length > 0 已经由前面的检查保证）
                return newPath;
            }
            // 如果是子路径（以目标路径为前缀）
            if (p.length > path.length) {
                const pathPrefix = p.slice(0, path.length);
                const pathPrefixKey = JSON.stringify(pathPrefix);
                if (pathPrefixKey === pathKey) {
                    const childPath = p.slice(1);
                    // 检查左移后的子路径是否为空，如果为空则不处理
                    if (childPath.length === 0) {
                        return p; // 保持不变
                    }
                    childPathMap.set(pKey, childPath);
                    // 左移子路径
                    return childPath;
                }
            }
            // 其他路径保持不变
            return p;
        }).filter((p): p is string[] => p !== null);
        
        // 如果 newPath 不为空，则添加
        if (newPath.length > 0) {
            updatedPaths.push(newPath);
        }
        const rootAfter = Paths.buildTree(updatedPaths);
        console.log('=== moveLeft 移动后 ===');
        Paths.printTree(rootAfter);
        return { updatedPaths, newPath, childPathMap };
    }


    // 右移path，在前面添加前一个兄弟节点的路径段
    // 如果path有子路径，所有子路径也会右移，保持相对关系不变
    // 如果前一个兄弟节点不存在，则抛出错误
    static moveRight(paths: string[][], path: string[]): { updatedPaths: string[][], newPath: string[], childPathMap: Map<string, string[]> } {
        if (path.length === 0) {
            throw new Error('Cannot move right: root path cannot be moved right');
        }
        console.log(`=== moveRight 要移动的path: ${JSON.stringify(path)} ===`);
        const root = Paths.buildTree(paths);
        console.log('=== moveRight 移动前 ===');
        Paths.printTree(root);
        const node = Paths.findNode(root, path);
        if (!node || !node.parent) {
            throw new Error(`Cannot move right: path ${JSON.stringify(path)} not found or has no parent`);
        }
        const parent = node.parent;
        const siblings = [...parent.children];
        siblings.sort((a: TreeModel.Node<PathNodeData>, b: TreeModel.Node<PathNodeData>) => a.model.originalIndex - b.model.originalIndex);
        const currentIndex = siblings.indexOf(node);
        if (currentIndex === -1) {
            throw new Error(`Cannot move right: path ${JSON.stringify(path)} not found in siblings`);
        }
        if (currentIndex === 0) {
            throw new Error(`Cannot move right: path ${JSON.stringify(path)} has no previous sibling`);
        }
        const prevNode = siblings[currentIndex - 1];
        const prevPath = prevNode.model.path;
        const newPath = [...prevPath, path[path.length - 1]];
        const newPathKey = JSON.stringify(newPath);
        const pathKey = JSON.stringify(path);
        const childPathMap = new Map<string, string[]>();
        
        // 检查右移后的路径是否已存在，如果存在则抛出错误
        const existingNewPath = paths.find(p => JSON.stringify(p) === newPathKey);
        if (existingNewPath) {
            throw new Error(`Cannot move right: path ${JSON.stringify(newPath)} already exists`);
        }
        
        // 处理所有路径：右移目标路径及其子路径
        const updatedPaths = paths.map(p => {
            const pKey = JSON.stringify(p);
            // 如果是目标路径本身
            if (pKey === pathKey) {
                return newPath;
            }
            // 如果是子路径（以目标路径为前缀）
            if (p.length > path.length) {
                const pathPrefix = p.slice(0, path.length);
                const pathPrefixKey = JSON.stringify(pathPrefix);
                if (pathPrefixKey === pathKey) {
                    // 子路径应该变成：前一个兄弟节点路径 + 目标路径的最后一段 + 子路径的剩余部分
                    // 例如：path = ["B"], prevPath = ["A"], p = ["B", "C", "D"]
                    // 结果应该是：["A", "B", "C", "D"]
                    const suffix = p.slice(path.length);
                    const childPath = [...prevPath, path[path.length - 1], ...suffix];
                    childPathMap.set(pKey, childPath);
                    // 右移子路径
                    return childPath;
                }
            }
            // 其他路径保持不变
            return p;
        });
        
        // 添加新的路径
        updatedPaths.push(newPath);
        const rootAfter = Paths.buildTree(updatedPaths);
        console.log('=== moveRight 移动后 ===');
        Paths.printTree(rootAfter);
        return { updatedPaths, newPath, childPathMap };
    }

    

    // 判断parentPath是否是childPath的父路径
    static isParentPath(parentPath: string[], childPath: string[]): boolean {
        if (parentPath.length >= childPath.length) {
            return false;
        }
        for (let i = 0; i < parentPath.length; i++) {
            if (parentPath[i] !== childPath[i]) {
                return false;
            }
        }
        return true;
    }


    // 获取path的父路径，如果path为空或只有一级则返回null
    static getParentPath(path: string[]): string[] | null {
        if (path.length === 0) {
            return null;
        }
        const parentPath = path.slice(0, -1);
        return parentPath.length > 0 ? parentPath : null;
    }


    // 判断path是否可以上移
    static canMoveUp(paths: string[][], path: string[]): boolean {
        if (path.length === 0) {
            return false;
        }
        const root = Paths.buildTree(paths);
        const node = Paths.findNode(root, path);
        if (!node || !node.parent) {
            return false;
        }
        const parent = node.parent;
        const siblings = [...parent.children];
        siblings.sort((a: TreeModel.Node<PathNodeData>, b: TreeModel.Node<PathNodeData>) => a.model.originalIndex - b.model.originalIndex);
        const currentIndex = siblings.indexOf(node);
        return currentIndex !== -1 && currentIndex > 0;
    }


    // 判断path是否可以下移
    static canMoveDown(paths: string[][], path: string[]): boolean {
        if (path.length === 0) {
            return false;
        }
        const root = Paths.buildTree(paths);
        const node = Paths.findNode(root, path);
        if (!node || !node.parent) {
            return false;
        }
        const parent = node.parent;
        const siblings = [...parent.children];
        siblings.sort((a: TreeModel.Node<PathNodeData>, b: TreeModel.Node<PathNodeData>) => a.model.originalIndex - b.model.originalIndex);
        const currentIndex = siblings.indexOf(node);
        return currentIndex !== -1 && currentIndex < siblings.length - 1;
    }


    // 判断path是否可以左移
    static canMoveLeft(paths: string[][], path: string[]): boolean {
        if (path.length <= 1) {
            return false;
        }
        const newPath = path.slice(1);
        const newPathKey = JSON.stringify(newPath);
        // 检查左移后的路径是否已存在
        const existingNewPath = paths.find(p => JSON.stringify(p) === newPathKey);
        return !existingNewPath;
    }


    // 判断path是否可以右移
    static canMoveRight(paths: string[][], path: string[]): boolean {
        if (path.length === 0) {
            return false;
        }
        const root = Paths.buildTree(paths);
        const node = Paths.findNode(root, path);
        if (!node || !node.parent) {
            return false;
        }
        const parent = node.parent;
        const siblings = [...parent.children];
        siblings.sort((a: TreeModel.Node<PathNodeData>, b: TreeModel.Node<PathNodeData>) => a.model.originalIndex - b.model.originalIndex);
        const currentIndex = siblings.indexOf(node);
        if (currentIndex === -1 || currentIndex === 0) {
            return false;
        }
        const prevNode = siblings[currentIndex - 1];
        const prevPath = prevNode.model.path;
        const newPath = [...prevPath, path[path.length - 1]];
        const newPathKey = JSON.stringify(newPath);
        // 检查右移后的路径是否已存在
        const existingNewPath = paths.find(p => JSON.stringify(p) === newPathKey);
        return !existingNewPath;
    }


    // 删除path及其所有子路径
    static deletePath(paths: string[][], path: string[]): string[][] {
        if (path.length === 0) {
            return paths;
        }
        const pathKey = JSON.stringify(path);
        const updatedPaths = paths.filter(p => {
            const pKey = JSON.stringify(p);
            // 如果是目标路径本身，删除
            if (pKey === pathKey) {
                return false;
            }
            // 如果是子路径（以目标路径为前缀），删除
            if (p.length > path.length) {
                const pathPrefix = p.slice(0, path.length);
                const pathPrefixKey = JSON.stringify(pathPrefix);
                if (pathPrefixKey === pathKey) {
                    return false;
                }
            }
            return true;
        });
        return updatedPaths;
    }


}

