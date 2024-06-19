export class MockCrudService<T> {
  getMany = jest.fn();
  getOne = jest.fn();
  createOne = jest.fn();
  createMany = jest.fn();
  updateOne = jest.fn();
  replaceOne = jest.fn();
  deleteOne = jest.fn();
  recoverOne = jest.fn();
}
