// Stub module for @expo/ui/swift-ui on web.
// The app only uses web exports for API routes, so native UI components
// are replaced with no-ops to avoid requireNativeViewManager errors.

const noop = () => null;

module.exports = {
  Button: noop,
  ContextMenu: noop,
  DatePicker: noop,
  Host: noop,
  HStack: noop,
  Image: noop,
  Menu: noop,
  Picker: noop,
  Section: noop,
  Spacer: noop,
  Text: noop,
  VStack: noop,
};
