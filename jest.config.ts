const jestConfig: { [K: string]: unknown } = {
  preset: 'ts-jest',
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^#/(.*)$': '<rootDir>/src/$1',
  },
};

export default jestConfig;
