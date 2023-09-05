export default function ({ types: t }) {
    return {
      visitor: {
        ImportDeclaration(path) {
          const source = path.node.source;
          
          // Determine if the import is a relative path, or using the path alias
          if (source && source.value && !source.value.endsWith('.js')) {
            if (source.value.startsWith('./') || source.value.startsWith('../') || source.value.startsWith('@/')) {
              source.value += '.js';
            }
          }
        }
      }
    };
  };
  